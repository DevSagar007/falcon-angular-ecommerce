import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import type { Product, ProductListResult } from "../../types/product";
import type { PlaceOrderRequest, PlaceOrderResult } from "../../types/order";

/**
 * Client for the mock REST API (`src/server/api.ts`). In the browser these are real HTTP calls;
 * during server rendering they are answered in-process (see `InProcessApiBackend`) and the
 * responses are transferred to the browser, so hydration does not fetch them again.
 */
@Injectable({ providedIn: "root" })
export class CatalogApi {
  private readonly http = inject(HttpClient);

  getProducts(params: URLSearchParams): Observable<ProductListResult> {
    const query = params.toString();
    return this.http.get<ProductListResult>(query ? `/api/products?${query}` : "/api/products");
  }

  getProduct(idOrSlug: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${encodeURIComponent(idOrSlug)}`);
  }

  getRelated(idOrSlug: string): Observable<{ items: Product[] }> {
    return this.http.get<{ items: Product[] }>(`/api/products/${encodeURIComponent(idOrSlug)}/related`);
  }

  placeOrder(request: PlaceOrderRequest): Observable<PlaceOrderResult> {
    return this.http.post<PlaceOrderResult>("/api/orders", request);
  }
}
