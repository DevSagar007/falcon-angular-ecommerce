import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ArrowRight } from "lucide";
import { cartTotals } from "../../../lib/pricing";
import { DemoNotice, OrderTotals } from "../../cart/order-totals";
import { CartStore } from "../../core/cart.store";
import { SeoService } from "../../core/seo.service";
import { Breadcrumb } from "../../shared/ui/breadcrumb";
import { Button } from "../../shared/ui/button";
import { Icon } from "../../shared/ui/icon";
import { Skeleton } from "../../shared/ui/skeleton";
import { CartLine } from "./cart-line";

@Component({
  selector: "app-cart-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DemoNotice, OrderTotals, Breadcrumb, Button, Icon, Skeleton, CartLine],
  host: { class: "contents" },
  template: `
    <main class="mx-auto mt-17.5 w-[calc(100%-32px)] max-w-317.5">
      <nav appBreadcrumb [items]="breadcrumb"></nav>
      <h1 class="mb-8 text-4xl -tracking-px">My Cart</h1>
      @if (!cart.hydrated()) {
        <div class="grid gap-4" aria-busy="true">
          <p class="sr-only" role="status">Loading your cart…</p>
          <div appSkeleton class="h-34 rounded-lg"></div>
          <div appSkeleton class="h-34 rounded-lg"></div>
        </div>
      } @else if (cart.items().length === 0) {
        <div class="rounded-lg bg-white px-5 py-20 text-center">
          <h2 class="mb-6 text-2xl">Your cart is empty</h2>
          <a appButton routerLink="/products">Continue shopping</a>
        </div>
      } @else {
        <div class="grid items-start gap-7 min-[901px]:grid-cols-[minmax(0,1fr)_360px]">
          <ul class="m-0 grid list-none gap-4 p-0" aria-label="Cart items">
            @for (item of cart.items(); track item.id) {
              <li appCartLine [item]="item"></li>
            }
          </ul>
          <aside class="rounded-lg bg-white p-5 min-[901px]:sticky min-[901px]:top-6" aria-labelledby="cart-summary">
            <h2 id="cart-summary" class="mb-5 text-xl">Order summary</h2>
            <dl appOrderTotals [totals]="totals()"></dl>
            <a appButton class="mt-5 w-full" routerLink="/checkout">
              Proceed to Checkout <svg [appIcon]="icons.ArrowRight" [size]="16"></svg>
            </a>
            <app-demo-notice />
          </aside>
        </div>
      }
    </main>
  `,
})
export class CartPage {
  protected readonly cart = inject(CartStore);
  protected readonly icons = { ArrowRight };
  protected readonly breadcrumb = [{ label: "Home", href: "/" }, { label: "My Cart" }];
  protected readonly totals = computed(() => cartTotals(this.cart.items()));

  constructor() {
    inject(SeoService).set({ title: "My cart", robots: { index: false } });
  }
}
