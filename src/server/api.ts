import { parseProductQuery } from "../lib/product-query";
import { getProductById, getProducts, getRelatedProducts } from "./product.service";
import { placeOrder } from "./place-order";

export type ApiResponse = { status: number; body: unknown };

const PRODUCT = /^\/api\/products\/([^/]+)$/;
const RELATED = /^\/api\/products\/([^/]+)\/related$/;

function decode(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Mock REST API over the same service the pages use. Shared by the Express server and the
 * in-process HTTP backend used during server rendering, so both always return the same data.
 * Malformed query params are normalized, not rejected. Returns null for unknown routes.
 */
export async function handleApiRequest(
  method: string,
  pathname: string,
  searchParams: URLSearchParams,
  body?: unknown,
): Promise<ApiResponse | null> {
  if (pathname === "/api/products" && method === "GET") {
    try {
      return { status: 200, body: await getProducts(parseProductQuery(searchParams)) };
    } catch {
      return { status: 500, body: { error: "Failed to load products" } };
    }
  }

  const related = RELATED.exec(pathname);
  if (related && method === "GET") {
    const id = decode(related[1]);
    if (!(await getProductById(id))) return { status: 404, body: { error: "Product not found" } };
    return { status: 200, body: { items: await getRelatedProducts(id) } };
  }

  const product = PRODUCT.exec(pathname);
  if (product && method === "GET") {
    const found = await getProductById(decode(product[1]));
    return found ? { status: 200, body: found } : { status: 404, body: { error: "Product not found" } };
  }

  // Replaces the former Next.js Server Action; the client posts { customer, lines }.
  if (pathname === "/api/orders" && method === "POST") {
    const payload = (body ?? {}) as { customer?: unknown; lines?: unknown };
    return { status: 200, body: await placeOrder(payload.customer, payload.lines) };
  }

  return null;
}
