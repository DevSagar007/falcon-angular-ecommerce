import { HttpErrorResponse } from "@angular/common/http";
import { RESPONSE_INIT, inject } from "@angular/core";
import { RedirectCommand, Router, type ResolveFn } from "@angular/router";
import { catchError, map, of, switchMap } from "rxjs";
import { productPath } from "../../../lib/utils";
import type { Product } from "../../../types/product";
import { CatalogApi } from "../../core/catalog-api";

export type ProductDetailData =
  | { status: "ok"; product: Product; related: Product[] }
  | { status: "not-found" }
  | { status: "error" };

export const productDetailResolver: ResolveFn<ProductDetailData> = (route) => {
  const api = inject(CatalogApi);
  const router = inject(Router);
  const response = inject(RESPONSE_INIT, { optional: true });
  const slug = route.paramMap.get("slug") ?? "";

  return api.getProduct(slug).pipe(
    switchMap((product) => {
      // Legacy /products/prod-001 links resolve by id; send them to the canonical slug URL.
      if (slug !== product.slug) {
        if (response) response.status = 308;
        return of(new RedirectCommand(router.parseUrl(productPath(product)), { replaceUrl: true }));
      }
      return api.getRelated(product.id).pipe(
        map((related) => ({ status: "ok", product, related: related.items }) satisfies ProductDetailData),
      );
    }),
    catchError((error: unknown) => {
      const notFound = error instanceof HttpErrorResponse && error.status === 404;
      return of({ status: notFound ? "not-found" : "error" } satisfies ProductDetailData);
    }),
  );
};
