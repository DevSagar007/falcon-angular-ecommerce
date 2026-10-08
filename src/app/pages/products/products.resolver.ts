import { RESPONSE_INIT, inject } from "@angular/core";
import { RedirectCommand, Router, type ParamMap, type ResolveFn } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { productsHref } from "../../../lib/product-query";
import type { ProductListResult } from "../../../types/product";
import { CatalogApi } from "../../core/catalog-api";

export type ListingData = { status: "ok"; result: ProductListResult } | { status: "error" };

/** First value of every query param, as the API and `productsHref` expect. */
export function toURLSearchParams(params: ParamMap) {
  const result = new URLSearchParams();
  for (const key of params.keys) {
    const value = params.get(key);
    if (value !== null) result.set(key, value);
  }
  return result;
}

export const productsResolver: ResolveFn<ListingData> = (route) => {
  const router = inject(Router);
  const response = inject(RESPONSE_INIT, { optional: true });
  const raw = toURLSearchParams(route.queryParamMap);

  return inject(CatalogApi)
    .getProducts(raw)
    .pipe(
      map((result) => {
        // Malformed (?page=abc, ?page=-2) or out-of-range (?page=999) pages redirect to the page actually shown.
        const rawPage = raw.get("page");
        if (rawPage !== null && rawPage !== String(result.page)) {
          if (response) response.status = 307;
          const target = productsHref(raw, { page: result.page > 1 ? String(result.page) : null });
          return new RedirectCommand(router.parseUrl(target), { replaceUrl: true });
        }
        return { status: "ok", result } satisfies ListingData;
      }),
      catchError(() => of({ status: "error" } satisfies ListingData)),
    );
};
