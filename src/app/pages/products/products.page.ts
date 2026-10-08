import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";
import { SeoService } from "../../core/seo.service";
import { RouteError } from "../status/route-error";
import { ProductBrowser } from "./product-browser";
import type { ListingData } from "./products.resolver";

const FILTER_KEYS = ["search", "category", "minPrice", "maxPrice", "rating", "sort"];

@Component({
  selector: "app-products-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductBrowser, RouteError],
  host: { class: "contents" },
  template: `
    @let data = listing();
    @if (data.status === "ok") {
      <app-product-browser [result]="data.result" />
    } @else {
      <app-route-error />
    }
  `,
})
export class ProductsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly listing$ = this.route.data.pipe(map((data) => data["listing"] as ListingData));
  protected readonly listing = toSignal(this.listing$, { requireSync: true });

  constructor() {
    const seo = inject(SeoService);
    this.listing$.pipe(takeUntilDestroyed()).subscribe((data) => {
      if (data.status !== "ok") return seo.set({ robots: { index: false } });
      const { query } = data.result;
      const params = this.route.snapshot.queryParamMap;
      const filtered = FILTER_KEYS.some((key) => params.has(key));
      seo.set({
        title: query.category ? `Shop ${query.category}` : "Shop all products",
        description:
          "Browse 500+ products across electronics, audio, lifestyle and accessories. Search, filter and sort the full Falcon collection.",
        canonical: query.page > 1 ? `/products?page=${query.page}` : "/products",
        // Filter combinations are near-duplicates of the main listing; keep them out of the index.
        robots: filtered ? { index: false, follow: true } : undefined,
      });
    });
  }
}
