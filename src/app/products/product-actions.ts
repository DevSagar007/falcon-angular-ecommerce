import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, linkedSignal, signal } from "@angular/core";
import { Check, Minus, Plus, ShoppingCart } from "lucide";
import type { CartProduct } from "../../lib/cart";
import { CartStore } from "../core/cart.store";
import { Button } from "../shared/ui/button";
import { Icon } from "../shared/ui/icon";

@Component({
  selector: "app-product-actions",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  host: { class: "contents" },
  template: `
    @if (product().stock < 1) {
      <button appButton class="my-6.25 min-h-11" type="button" disabled>Out of stock</button>
    } @else {
      <div class="my-6.25 flex flex-wrap gap-2.5">
        <div class="inline-flex items-center gap-3.75 rounded-[1.375rem] border border-(--line) px-2 py-1" role="group" aria-label="Quantity">
          <button
            appButton
            type="button"
            variant="ghost"
            size="icon"
            class="h-7 w-7 rounded-full bg-[#f1f5f9]"
            (click)="quantity.set(Math.max(1, quantity() - 1))"
            aria-label="Decrease quantity"
            [disabled]="quantity() <= 1"
          >
            <svg [appIcon]="icons.Minus" [size]="14"></svg>
          </button>
          <output class="min-w-4 text-center text-sm" aria-live="polite">{{ quantity() }}</output>
          <button
            appButton
            type="button"
            variant="ghost"
            size="icon"
            class="h-7 w-7 rounded-full bg-[#f1f5f9]"
            (click)="quantity.set(Math.min(product().stock, quantity() + 1))"
            aria-label="Increase quantity"
            [disabled]="quantity() >= product().stock"
          >
            <svg [appIcon]="icons.Plus" [size]="14"></svg>
          </button>
        </div>
        <button appButton class="min-h-11" type="button" (click)="add()">
          <svg [appIcon]="added() ? icons.Check : icons.ShoppingCart" [size]="17"></svg>
          <span aria-live="polite">{{ added() ? "Added" : "Add to Cart" }}</span>
        </button>
      </div>
    }
  `,
})
export class ProductActions {
  readonly product = input.required<CartProduct>();

  private readonly cart = inject(CartStore);
  protected readonly icons = { Check, Minus, Plus, ShoppingCart };
  protected readonly Math = Math;
  /** Starts at 1 again when the page is reused for another product. */
  private readonly productId = computed(() => this.product().id);
  protected readonly quantity = linkedSignal({ source: this.productId, computation: () => 1 });
  protected readonly added = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resetTimer));
  }

  protected add() {
    this.cart.add(this.product(), this.quantity());
    this.added.set(true);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.added.set(false), 1500);
  }
}
