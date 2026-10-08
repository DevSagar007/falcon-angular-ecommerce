import { randomUUID } from "node:crypto";
import { checkoutSchema, orderLinesSchema } from "../schemas/checkout.schema";
import type { PlaceOrderResult } from "../types/order";
import { checkOrder } from "./order.service";

/**
 * Simulated order placement. Re-validates the form on the server (client validation can be
 * bypassed) and re-prices the cart from the catalog. Nothing is stored, charged or sent anywhere.
 */
export async function placeOrder(customer: unknown, lines: unknown): Promise<PlaceOrderResult> {
  const form = checkoutSchema.safeParse(customer);
  if (!form.success) return { ok: false, error: "Please correct the highlighted fields and try again." };

  const cart = orderLinesSchema.safeParse(lines);
  if (!cart.success) return { ok: false, error: "Your cart could not be read. Please review it and try again." };

  const check = await checkOrder(cart.data);
  if (!check.ok) return check;

  return {
    ok: true,
    orderId: `DEMO-${randomUUID().slice(0, 8).toUpperCase()}`,
    total: check.total,
    count: check.count,
  };
}
