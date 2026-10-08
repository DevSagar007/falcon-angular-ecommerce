import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { map } from "rxjs";
import { toCartProduct } from "../../../lib/cart";
import { discountPercent } from "../../../lib/pricing";
import { productPath, taka } from "../../../lib/utils";
import type { Product } from "../../../types/product";
import { SeoService } from "../../core/seo.service";
import { ProductActions } from "../../products/product-actions";
import { ProductGrid } from "../../products/product-grid";
import { RatingStars, reviewLabel } from "../../products/rating-stars";
import { Breadcrumb } from "../../shared/ui/breadcrumb";
import { NotFoundPage } from "../status/not-found.page";
import { RouteError } from "../status/route-error";
import type { ProductDetailData } from "./product-detail.resolver";

/** Structured data limited to facts the catalog actually holds (no aggregate rating or brand). */
function productJsonLd(product: Product, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image],
    sku: product.id,
    category: product.category,
    url,
    offers: {
      "@type": "Offer",
      url,
      price: product.price,
      priceCurrency: "BDT",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviews.length > 0 && {
      review: product.reviews.map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author },
        reviewBody: review.comment,
        reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
      })),
    }),
  };
}

@Component({
  selector: "app-product-detail-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, ProductActions, ProductGrid, RatingStars, Breadcrumb, NotFoundPage, RouteError],
  host: { class: "contents" },
  template: `
    @let data = detail();
    @if (data.status === "ok") {
      @let product = data.product;
      @let discount = discountPercent(product.price, product.originalPrice);
      @let reviewCount = product.reviews.length;
      @let inStock = product.stock > 0;
      <main class="mx-auto mt-17.5 w-[calc(100%-32px)] max-w-317.5">
        <nav
          appBreadcrumb
          [items]="[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/products' },
            { label: product.category, href: '/products', queryParams: { category: product.category } },
            { label: product.name },
          ]"
        ></nav>
        <div class="grid gap-13.75 rounded-lg bg-white p-6.25 max-[600px]:gap-4 max-[600px]:p-4 min-[801px]:grid-cols-2">
          <div class="min-w-0">
            <img
              class="aspect-square h-auto w-full rounded-md object-cover"
              [ngSrc]="product.image"
              [alt]="product.name"
              width="900"
              height="900"
              sizes="(max-width: 800px) 100vw, 50vw"
              [loaderParams]="{ ratio: 1 }"
              priority
            />
          </div>
          <div class="min-w-0 p-6.25 max-[600px]:p-0">
            <p class="kicker">{{ product.category }}</p>
            <h1 class="my-3 wrap-break-word text-[2.375rem] leading-tight -tracking-px max-[600px]:text-[1.75rem]">{{ product.name }}</h1>
            <div class="flex items-center gap-1 text-[13px] text-[#f59e0b]">
              <app-rating-stars [rating]="product.rating" class="text-base" />
              <small class="text-[11px] text-(--muted)">
                {{ product.rating }} out of 5 · <a routerLink="." fragment="reviews">{{ reviewLabel(reviewCount) }}</a>
              </small>
            </div>
            <div class="my-5.5 flex flex-wrap items-baseline gap-x-2.5 text-[1.5625rem] font-bold text-(--text)">
              {{ taka(product.price) }}
              @if (discount > 0) {
                <del class="text-xs font-normal text-[#94a3b8]"><span class="sr-only">Was </span>{{ taka(product.originalPrice) }}</del>
                <span class="rounded bg-[#fee2e2] px-1.75 py-1 text-[0.6875rem] font-semibold text-[#ef4444]">-{{ discount }}%</span>
              }
            </div>
            <p class="max-w-140 leading-[1.7] text-(--muted)">{{ product.description }}</p>
            <p [class]="'my-5 text-xs ' + (!inStock || product.stock <= 3 ? 'text-red-600' : 'text-green-700')">
              <span aria-hidden="true">● </span>{{ inStock ? "In stock · " + product.stock + " available" : "Out of stock" }}
            </p>
            <app-product-actions [product]="cartProduct()!" />
            <dl class="m-0 grid gap-3 border-t border-(--line) pt-4 text-xs min-[801px]:grid-cols-2">
              <dt class="font-bold">Delivery</dt>
              <dd class="m-0">No delivery fee in this demo store</dd>
              <dt class="font-bold">Sold by</dt>
              <dd class="m-0">Falcon Official Store</dd>
            </dl>
          </div>
        </div>

        <section class="mt-12.5 scroll-mt-6" id="reviews" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" class="mb-1.5 text-[1.625rem]">Customer reviews</h2>
          <p class="mt-0 text-xs text-(--muted)">Catalog rating {{ product.rating }} out of 5 · {{ reviewLabel(reviewCount) }}</p>
          @if (reviewCount > 0) {
            <ul class="mt-4.5 grid list-none gap-3.5 p-0">
              @for (review of product.reviews; track review.id) {
                <li class="rounded-lg bg-white p-4.5">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <b>{{ review.author }}</b>
                    <app-rating-stars [rating]="review.rating" class="text-base" />
                  </div>
                  <p class="m-0 text-sm leading-[1.6] text-(--muted)">{{ review.comment }}</p>
                </li>
              }
            </ul>
          } @else {
            <p class="rounded-lg bg-white p-4.5 text-sm text-(--muted)">No written reviews yet.</p>
          }
        </section>

        @if (data.related.length > 0) {
          <section class="mt-18.75" aria-labelledby="related-heading">
            <h2 id="related-heading" class="mb-6 text-[1.625rem]">Related products</h2>
            <app-product-grid [items]="data.related" />
          </section>
        }
      </main>
    } @else if (data.status === "not-found") {
      <app-not-found-page variant="product" />
    } @else {
      <app-route-error />
    }
  `,
})
export class ProductDetailPage {
  protected readonly taka = taka;
  protected readonly discountPercent = discountPercent;
  protected readonly reviewLabel = reviewLabel;

  private readonly detail$ = inject(ActivatedRoute).data.pipe(map((data) => data["detail"] as ProductDetailData));
  protected readonly detail = toSignal(this.detail$, { requireSync: true });
  /** Stable cart payload for the current product (a new object per render would reset the quantity picker). */
  protected readonly cartProduct = computed(() => {
    const data = this.detail();
    return data.status === "ok" ? toCartProduct(data.product) : null;
  });

  constructor() {
    const seo = inject(SeoService);
    this.detail$.pipe(takeUntilDestroyed()).subscribe((data) => {
      // The 404 and error views set their own metadata.
      if (data.status !== "ok") return;
      const { product } = data;
      const url = productPath(product);
      seo.set({
        title: product.name,
        description: product.description,
        canonical: url,
        openGraph: {
          title: product.name,
          description: product.description,
          url,
          image: { url: product.image, alt: product.name },
        },
        jsonLd: productJsonLd(product, seo.absolute(url)),
      });
    });
  }
}
