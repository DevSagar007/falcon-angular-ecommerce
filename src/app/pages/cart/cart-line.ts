import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Minus, Plus, Trash2 } from "lucide";
import type { CartItem } from "../../../lib/cart";
import { productPath, taka } from "../../../lib/utils";
import { CartStore } from "../../core/cart.store";
import { Button } from "../../shared/ui/button";
import { Icon } from "../../shared/ui/icon";
import { Tooltip } from "../../shared/ui/tooltip";

/**
 * OnPush with an immutable item input: untouched items keep their identity,
 * so changing one line's quantity re-renders only that line.
 */
@Component({
  selector: "li[appCartLine]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, Button, Icon, Tooltip],
  host: {
    class: "grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-lg bg-white p-4 min-[601px]:grid-cols-[100px_minmax(0,1fr)_auto]",
  },
  template: `
    @let line = item();
    <a [routerLink]="href()" class="overflow-hidden rounded-md bg-[#f1f5f9]" tabindex="-1" aria-hidden="true">
      <img class="aspect-square h-auto w-full object-cover" [ngSrc]="line.image" alt="" width="100" height="100" [loaderParams]="{ ratio: 1 }" />
    </a>
    <div class="min-w-0">
      <a [routerLink]="href()" class="block min-w-0">
        <h2 class="line-clamp-2 wrap-break-word text-base font-semibold">{{ line.name }}</h2>
      </a>
      <p class="mt-1 text-sm text-(--muted)">{{ line.category }} · {{ taka(line.price) }} each</p>
      <div
        class="mt-4 inline-flex h-9 items-center gap-1 rounded-[1.375rem] border border-(--line) px-1"
        role="group"
        [attr.aria-label]="'Quantity of ' + line.name"
      >
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon"
          class="h-7 w-7 rounded-full bg-[#f1f5f9]"
          (click)="cart.dec(line.id)"
          [attr.aria-label]="'Decrease quantity of ' + line.name"
          [disabled]="line.quantity <= 1"
        >
          <svg [appIcon]="icons.Minus" [size]="14"></svg>
        </button>
        <output class="min-w-9 text-center text-sm" aria-live="polite">{{ quantityLabel() }}</output>
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon"
          class="h-7 w-7 rounded-full bg-[#f1f5f9]"
          (click)="cart.inc(line.id)"
          [attr.aria-label]="'Increase quantity of ' + line.name"
          [disabled]="line.quantity >= line.stock"
        >
          <svg [appIcon]="icons.Plus" [size]="14"></svg>
        </button>
      </div>
      @if (line.quantity >= line.stock) {
        <p class="mt-2 text-xs text-amber-700">Only {{ line.stock }} in stock</p>
      }
    </div>
    <div class="col-span-2 flex items-center justify-between gap-3 min-[601px]:col-span-1 min-[601px]:flex-col min-[601px]:items-end">
      <b class="whitespace-nowrap text-base">{{ taka(line.price * line.quantity) }}</b>
      <app-tooltip content="Remove from cart">
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon"
          class="h-9 w-9 rounded-full text-red-500 hover:bg-red-50"
          (click)="cart.remove(line.id)"
          [attr.aria-label]="'Remove ' + line.name + ' from cart'"
        >
          <svg [appIcon]="icons.Trash2" [size]="16"></svg>
        </button>
      </app-tooltip>
    </div>
  `,
})
export class CartLine {
  readonly item = input.required<CartItem>();

  protected readonly cart = inject(CartStore);
  protected readonly icons = { Minus, Plus, Trash2 };
  protected readonly taka = taka;
  protected readonly href = computed(() => productPath(this.item()));
  protected readonly quantityLabel = computed(() => String(this.item().quantity).padStart(2, "0"));
}
