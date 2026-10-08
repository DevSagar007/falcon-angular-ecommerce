import { getProductById } from "./product.service";
import { toCartProduct, type CartProduct } from "../lib/cart";
import { cartTotals } from "../lib/pricing";
import type { OrderLine } from "../schemas/checkout.schema";

export type OrderCheck =
  | { ok: true; subtotal: number; shipping: number; total: number; count: number }
  | {
      ok: false;
      error: string;
      /** Current catalog data for every line (null = no longer sold) so the client can update its cart. */
      catalog: Record<string, CartProduct | null>;
    };

/**
 * Re-checks a persisted cart against the catalog: the browser copy may be outdated
 * (price changed, stock reduced, product removed). Totals are always computed from catalog prices.
 */
export async function checkOrder(lines: OrderLine[]): Promise<OrderCheck> {
  const catalog: Record<string, CartProduct | null> = {};
  const problems: string[] = [];
  const priced: { price: number; quantity: number }[] = [];

  for (const line of lines) {
    const product = await getProductById(line.id);
    catalog[line.id] = product ? toCartProduct(product) : null;
    if (!product) {
      problems.push("An item in your cart is no longer available");
    } else if (product.stock < line.quantity) {
      problems.push(`Only ${product.stock} of ${product.name} in stock`);
    } else if (product.price !== line.price) {
      problems.push(`The price of ${product.name} has changed`);
    }
    if (product) priced.push({ price: product.price, quantity: line.quantity });
  }

  if (problems.length > 0) {
    return { ok: false, error: `${problems.join(". ")}. Your cart has been updated — please review it.`, catalog };
  }
  return { ok: true, ...cartTotals(priced) };
}
