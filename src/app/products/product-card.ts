import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { RouterLink } from "@angular/router";
import { ShoppingCart, Star } from "lucide";
import type { Product } from "../../types/product";
import { productPath, taka } from "../../lib/utils";
import { discountPercent } from "../../lib/pricing";
import { toCartProduct } from "../../lib/cart";
import { CartStore } from "../core/cart.store";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Icon } from "../shared/ui/icon";

@Component({
  selector: "article[appProductCard]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, Badge, Button, Icon],
  host: { class: "group min-w-0 overflow-hidden rounded-[7px] bg-white" },
  template: `
    @let p = product();
    <a [routerLink]="href()" class="relative block aspect-square overflow-hidden bg-[#e2e8f0]" tabindex="-1" aria-hidden="true">
      <img
        class="h-full w-full object-cover transition-transform duration-300 ease-[ease] group-hover:scale-[1.04]"
        [ngSrc]="p.image"
        alt=""
        width="600"
        height="600"
        sizes="(max-width: 600px) 50vw, (max-width: 1080px) 33vw, 25vw"
        [loaderParams]="{ ratio: 1 }"
        [priority]="priority()"
      />
      @if (discount() > 0) {
        <span appBadge variant="muted" class="absolute top-2.5 left-2.5 rounded-[3px] px-1.75 py-1 text-[11px]">-{{ discount() }}%</span>
      }
    </a>
    <div class="min-w-0 p-3.75 max-[601px]:p-3">
      <a [routerLink]="href()" class="block min-w-0">
        <h3 class="mb-2 line-clamp-2 wrap-break-word text-[15px] font-semibold">{{ p.name }}</h3>
      </a>
      <div class="flex items-center gap-1 text-[13px] text-[#f59e0b]">
        <svg [appIcon]="icons.Star" [size]="14" fill="currentColor"></svg>
        <span class="sr-only">Rated</span> {{ p.rating }}
        @if (p.reviews.length > 0) {
          <small class="text-[11px] text-(--muted)">({{ p.reviews.length }}<span class="sr-only"> written {{ p.reviews.length === 1 ? "review" : "reviews" }}</span>)</small>
        }
      </div>
      <div class="mt-3.5 flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
          <b class="whitespace-nowrap text-[17px]">{{ taka(p.price) }}</b>
          @if (discount() > 0) {
            <del class="ml-1.5 whitespace-nowrap text-[11px] text-[#94a3b8]"><span class="sr-only">Was </span>{{ taka(p.originalPrice) }}</del>
          }
        </div>
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon"
          class="grid size-8.5 place-items-center rounded-full bg-[#e6fffa] text-[#008e78]"
          [attr.aria-label]="soldOut() ? p.name + ' is out of stock' : 'Add ' + p.name + ' to cart'"
          [disabled]="soldOut()"
          (click)="addToCart()"
        >
          <svg [appIcon]="icons.ShoppingCart" [size]="17"></svg>
        </button>
      </div>
    </div>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Preload the image (first row of a listing, where it is the Largest Contentful Paint). */
  readonly priority = input(false);

  private readonly cart = inject(CartStore);
  protected readonly icons = { ShoppingCart, Star };
  protected readonly taka = taka;
  protected readonly href = computed(() => productPath(this.product()));
  protected readonly discount = computed(() => discountPercent(this.product().price, this.product().originalPrice));
  protected readonly soldOut = computed(() => this.product().stock < 1);

  protected addToCart() {
    this.cart.add(toCartProduct(this.product()));
  }
}
