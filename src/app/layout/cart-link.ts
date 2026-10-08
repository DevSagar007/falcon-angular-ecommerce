import { ChangeDetectionStrategy, Component, computed, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ShoppingCart } from "lucide";
import { CartStore } from "../core/cart.store";
import { Badge } from "../shared/ui/badge";
import { Icon } from "../shared/ui/icon";

@Component({
  selector: "app-cart-link",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Badge, Icon],
  host: { class: "contents" },
  template: `
    <a routerLink="/cart" class="relative flex items-center p-2" [attr.aria-label]="label()">
      <svg [appIcon]="icons.ShoppingCart" [size]="24"></svg>
      <span
        appBadge
        aria-hidden="true"
        class="absolute -right-0.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] text-white"
      >{{ count() }}</span>
      @if (cart.hydrated()) {
        <span class="sr-only" role="status">{{ label() }}</span>
      }
    </a>
  `,
})
export class CartLink {
  protected readonly cart = inject(CartStore);
  protected readonly icons = { ShoppingCart };
  protected readonly count = this.cart.count;
  protected readonly label = computed(() => `Cart, ${this.count()} ${this.count() === 1 ? "item" : "items"}`);
}
