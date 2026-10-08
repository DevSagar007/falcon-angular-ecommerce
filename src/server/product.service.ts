import seed from "../../data/products.json";
import { DEFAULT_LIMIT, MAX_LIMIT } from "../lib/product-query";
import type { Product, ProductListResult, ProductQuery } from "../types/product";

const CATALOG_SIZE = 520;
const RELATED_LIMIT = 4;

type CatalogEntry = { product: Product; family: number; searchText: string };

function roundTo10(value: number) {
  return Math.round(value / 10) * 10;
}

/**
 * Expands the 48 hand-written seed products into a deterministic 520-item mock catalog.
 * - Prices vary per edition; the old price keeps the seed's own discount ratio,
 *   so `originalPrice` is always greater than `price`.
 * - Written reviews belong only to the original seed product. Editions start with
 *   no reviews instead of duplicating another product's customer feedback.
 */
const catalog: CatalogEntry[] = Array.from({ length: CATALOG_SIZE }, (_, i) => {
  const family = i % seed.length;
  const base = seed[family] as Product;
  const edition = Math.floor(i / seed.length) + 1;
  const id = `prod-${String(i + 1).padStart(3, "0")}`;
  const price = Math.max(990, base.price + ((i * 137) % 1900) - 700);
  const originalPrice = roundTo10(price * (base.originalPrice / base.price));
  const name = edition === 1 ? base.name : `${base.name} Edition ${edition}`;
  const product: Product = {
    ...base,
    id,
    name,
    slug: `${base.slug}-${edition}`,
    price,
    originalPrice: originalPrice > price ? originalPrice : price,
    stock: Math.max(3, base.stock + ((i * 11) % 25) - 8),
    reviews: edition === 1 ? base.reviews.map((review) => ({ ...review, id: `${id}-${review.id}` })) : [],
  };
  return {
    product,
    family,
    searchText: `${name} ${base.category} ${base.description}`.toLowerCase(),
  };
});

const byKey = new Map<string, CatalogEntry>();
for (const entry of catalog) {
  byKey.set(entry.product.id, entry);
  byKey.set(entry.product.slug, entry);
}

export const categories = [...new Set(catalog.map((entry) => entry.product.category))];

/** Case-insensitive match against known categories; unknown values are ignored. */
export function resolveCategory(value: string | undefined) {
  if (!value) return undefined;
  const needle = value.toLowerCase();
  return categories.find((category) => category.toLowerCase() === needle);
}

const byId = (a: Product, b: Product) => a.id.localeCompare(b.id);
const comparators: Record<NonNullable<ProductQuery["sort"]>, (a: Product, b: Product) => number> = {
  featured: byId,
  "price-low": (a, b) => a.price - b.price || byId(a, b),
  "price-high": (a, b) => b.price - a.price || byId(a, b),
  rating: (a, b) => b.rating - a.rating || byId(a, b),
};

/**
 * Filters, then sorts, then paginates. Expects a query normalized by `parseProductQuery`,
 * but still guards the numeric bounds so direct callers cannot break pagination.
 */
export async function getProducts(q: ProductQuery = {}): Promise<ProductListResult> {
  const search = q.search?.trim().toLowerCase();
  const category = resolveCategory(q.category);
  const { minPrice, maxPrice, rating } = q;

  const list = catalog
    .filter(
      (entry) =>
        (!search || entry.searchText.includes(search)) &&
        (!category || entry.product.category === category) &&
        (minPrice === undefined || entry.product.price >= minPrice) &&
        (maxPrice === undefined || entry.product.price <= maxPrice) &&
        (rating === undefined || entry.product.rating >= rating),
    )
    .map((entry) => entry.product);

  const sort = q.sort ?? "featured";
  list.sort(comparators[sort] ?? byId);

  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(q.limit ?? DEFAULT_LIMIT)));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, Math.floor(q.page ?? 1)), totalPages);

  return {
    items: list.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
    totalPages,
    categories,
    query: { search: search || undefined, category, minPrice, maxPrice, rating, sort, page, limit },
  };
}

/** Looks a product up by id or slug (a single Map lookup). */
export async function getProductById(idOrSlug: string): Promise<Product | undefined> {
  return byKey.get(idOrSlug)?.product;
}

/** Same category, excluding other editions of the same product, best rated first. */
export async function getRelatedProducts(idOrSlug: string, limit = RELATED_LIMIT): Promise<Product[]> {
  const source = byKey.get(idOrSlug);
  if (!source) return [];
  return catalog
    .filter(
      (entry) =>
        entry.product.category === source.product.category && entry.family !== source.family,
    )
    .map((entry) => entry.product)
    .sort(comparators.rating)
    .slice(0, limit);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return catalog.map((entry) => entry.product.slug);
}
