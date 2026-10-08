import type { CartProduct } from "../lib/cart";
import type { CheckoutValues, OrderLine } from "../schemas/checkout.schema";

export type PlaceOrderRequest = { customer: CheckoutValues; lines: OrderLine[] };

export type PlaceOrderResult =
  | { ok: true; orderId: string; total: number; count: number }
  | { ok: false; error: string; catalog?: Record<string, CartProduct | null> };
