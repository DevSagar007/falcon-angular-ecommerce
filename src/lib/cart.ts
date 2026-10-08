import type { Product } from "../types/product";

/** Only what the cart UI and order check need; descriptions and reviews are not persisted. */
export type CartProduct = Pick<Product, "id" | "slug" | "name" | "image" | "category" | "price" | "stock">;
export type CartItem = CartProduct & { quantity: number };

export function toCartProduct(product: Product): CartProduct {
  const { id, slug, name, image, category, price, stock } = product;
  return { id, slug, name, image, category, price, stock };
}

export function clampQuantity(quantity: number, stock: number) {
  return Math.min(Math.max(1, Math.floor(quantity)), stock);
}

const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Drops malformed entries from localStorage (manual edits, old versions) and re-clamps quantities. */
export function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (
      !isText(item.id) || seen.has(item.id) || !isText(item.name) || !isText(item.image) ||
      !isCount(item.price) || !isCount(item.stock) || !isCount(item.quantity) ||
      item.stock < 1 || item.quantity < 1
    ) {
      continue;
    }
    seen.add(item.id);
    items.push({
      id: item.id,
      slug: isText(item.slug) ? item.slug : item.id,
      name: item.name,
      image: item.image,
      category: isText(item.category) ? item.category : "",
      price: item.price,
      stock: item.stock,
      quantity: clampQuantity(item.quantity, item.stock),
    });
  }
  return items;
}

export function addItem(items: CartItem[], product: CartProduct, quantity = 1): CartItem[] {
  if (product.stock < 1) return items;
  const existing = items.find((item) => item.id === product.id);
  if (!existing) return [...items, { ...product, quantity: clampQuantity(quantity, product.stock) }];
  return items.map((item) =>
    item.id === product.id
      ? { ...item, ...product, quantity: clampQuantity(item.quantity + quantity, product.stock) }
      : item,
  );
}

export function changeQuantity(items: CartItem[], id: string, delta: number): CartItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, quantity: clampQuantity(item.quantity + delta, item.stock) } : item,
  );
}

/** Applies fresh catalog data to the cart: updates price/stock, re-clamps quantities, drops discontinued items. */
export function syncWithCatalog(items: CartItem[], catalog: Record<string, CartProduct | null>): CartItem[] {
  return items.flatMap((item) => {
    if (!(item.id in catalog)) return [item];
    const fresh = catalog[item.id];
    if (!fresh || fresh.stock < 1) return [];
    return [{ ...item, ...fresh, quantity: clampQuantity(item.quantity, fresh.stock) }];
  });
}
