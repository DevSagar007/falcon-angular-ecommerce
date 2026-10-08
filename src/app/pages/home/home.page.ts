import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { ArrowRight, ChevronRight } from "lucide";
import { CatalogApi } from "../../core/catalog-api";
import { SeoService } from "../../core/seo.service";
import { ProductGrid } from "../../products/product-grid";
import { Button } from "../../shared/ui/button";
import { Icon } from "../../shared/ui/icon";
import type { Product } from "../../../types/product";

type FeaturedState = { status: "loading" } | { status: "ok"; items: Product[] } | { status: "error" };

@Component({
  selector: "app-home-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, ProductGrid, Button, Icon],
  host: { class: "contents" },
  template: `
    <main>
      <section class="mx-auto mt-8 grid w-[calc(100%-32px)] max-w-317.5 grid-cols-[1fr_1fr] overflow-hidden rounded-[8px] bg-white max-[901px]:grid-cols-1">
        <div class="p-16.25 max-[901px]:px-6 max-[901px]:py-10">
          <p class="kicker">The new Falcon collection</p>
          <h1 class="my-4.5 text-[clamp(45px,5vw,74px)] leading-[1.04] tracking-[-3px] max-[601px]:tracking-[-1.5px]">
            Everyday things.
            <br />
            <em class="font-normal text-(--teal)">Better chosen</em>
          </h1>
          <p class="mb-7 max-w-95 leading-[1.7] text-(--muted)">
            Experience a new platform for discovering useful, beautiful things made for modern life.
          </p>
          <a appButton routerLink="/products">Shop now <svg [appIcon]="icons.ArrowRight" [size]="17"></svg></a>
        </div>
        <div class="min-h-107.5 max-[901px]:min-h-65">
          <img
            class="h-full w-full object-cover"
            ngSrc="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1200&q=85"
            alt="Curated desk setup"
            width="1200"
            height="900"
            priority
            sizes="(max-width: 800px) 100vw, 50vw"
            [loaderParams]="{ ratio: 0.75 }"
          />
        </div>
      </section>
      <section class="mx-auto my-17.5 w-[calc(100%-32px)] max-w-317.5">
        <div class="mb-6 flex items-end justify-between">
          <div>
            <p class="kicker">Popular now</p>
            <h2 class="mt-2 text-[30px] max-[601px]:text-[24px]">Made for your everyday</h2>
          </div>
          <a routerLink="/products" class="flex items-center text-[13px] text-(--teal)">
            View all <svg [appIcon]="icons.ChevronRight" [size]="16"></svg>
          </a>
        </div>
        @switch (featured().status) {
          @case ("ok") {
            <app-product-grid [items]="featuredItems()" />
          }
          @case ("error") {
            <div class="rounded-[7px] bg-white px-5 py-12 text-center" role="status">
              <p class="mb-2 font-semibold">Popular products couldn't be loaded right now.</p>
              <a routerLink="/products" class="text-[13px] text-(--teal)">Browse all products</a>
            </div>
          }
        }
      </section>
      <section class="mx-auto my-22.5 grid min-h-82.5 w-[calc(100%-32px)] max-w-317.5 grid-cols-[1fr_1fr] overflow-hidden rounded-lg bg-(--navy) text-white max-[901px]:grid-cols-1 max-[601px]:my-12.5">
        <div class="p-15 max-[901px]:px-6 max-[901px]:py-10">
          <p class="kicker">Thoughtfully selected</p>
          <h2 class="mt-3.75 mb-6.25 text-[44px] leading-[1.05] text-white max-[601px]:text-[32px]">
            Good design
            <br />
            should feel easy
          </h2>
          <a appButton routerLink="/products">Explore collection</a>
        </div>
        <img
          class="h-full w-full object-cover"
          ngSrc="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=85"
          alt="Bright workspace"
          width="1200"
          height="900"
          sizes="(max-width: 800px) 100vw, 50vw"
          [loaderParams]="{ ratio: 0.75 }"
        />
      </section>
    </main>
  `,
})
export class HomePage {
  protected readonly icons = { ArrowRight, ChevronRight };
  /** Four best-rated products; if the request fails the rest of the page still renders, with a message. */
  protected readonly featured = toSignal(
    inject(CatalogApi)
      .getProducts(new URLSearchParams({ limit: "4", sort: "rating" }))
      .pipe(
        map((result): FeaturedState => ({ status: "ok", items: result.items })),
        catchError(() => of<FeaturedState>({ status: "error" })),
      ),
    { initialValue: { status: "loading" } as FeaturedState },
  );
  protected readonly featuredItems = computed(() => {
    const state = this.featured();
    return state.status === "ok" ? state.items : [];
  });

  constructor() {
    inject(SeoService).set({
      title: "Everyday things, better chosen",
      description:
        "Discover useful, beautiful products at fair prices. Shop 500+ items across electronics, audio, lifestyle and accessories.",
      canonical: "/",
    });
  }
}
