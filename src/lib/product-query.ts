import type { ProductQuery, SortOption } from "../types/product";

export const SORT_OPTIONS = ["featured", "price-low", "price-high", "rating"] as const satisfies readonly SortOption[];
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 48;
const MAX_SEARCH_LENGTH = 100;

export type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(params: RawSearchParams, key: string): string | undefined {
  const value = params instanceof URLSearchParams ? params.get(key) : params[key];
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

/** Strictly parses a non-negative decimal; rejects "abc", "1e3", "-5", "Infinity". */
function nonNegative(value: string | undefined): number | undefined {
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveInt(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

/**
 * Normalizes untrusted URL query parameters into a safe ProductQuery.
 * Malformed values are dropped instead of failing the whole request.
 */
export function parseProductQuery(params: RawSearchParams): ProductQuery {
  let minPrice = nonNegative(read(params, "minPrice"));
  let maxPrice = nonNegative(read(params, "maxPrice"));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const rating = nonNegative(read(params, "rating"));
  const sort = read(params, "sort");
  const limit = positiveInt(read(params, "limit"));

  return {
    search: read(params, "search")?.slice(0, MAX_SEARCH_LENGTH),
    category: read(params, "category"),
    minPrice,
    maxPrice,
    rating: rating !== undefined && rating > 0 ? Math.min(rating, 5) : undefined,
    sort: SORT_OPTIONS.find((option) => option === sort) ?? "featured",
    page: positiveInt(read(params, "page")) ?? 1,
    limit: limit === undefined ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT),
  };
}

/** Builds a /products URL that keeps the current params and applies the given changes. */
export function productsHref(current: URLSearchParams | string, changes: Record<string, string | null>) {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}
