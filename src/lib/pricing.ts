/**
 * This is a demo storefront: no delivery fee is charged. Keeping the fee in one place
 * means the cart, checkout and the server-side order check always show the same total.
 */
export const SHIPPING_FEE = 0;

/** Discount percentage, or 0 when there is no genuine markdown. */
export function discountPercent(price: number, originalPrice: number) {
  if (!(originalPrice > price) || price <= 0) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}

export function cartTotals(items: readonly { price: number; quantity: number }[]) {
  let count = 0;
  let subtotal = 0;
  for (const item of items) {
    count += item.quantity;
    subtotal += item.price * item.quantity;
  }
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  return { count, subtotal, shipping, total: subtotal + shipping };
}
