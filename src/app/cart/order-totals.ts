import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { cartTotals } from "../../lib/pricing";
import { taka } from "../../lib/utils";

type Totals = ReturnType<typeof cartTotals>;

/** Shared by cart and checkout so both always show the same breakdown. */
@Component({
  selector: "dl[appOrderTotals]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "m-0 grid gap-3 text-sm" },
  template: `
    <div class="flex items-center justify-between gap-4">
      <dt>Subtotal ({{ totals().count }} {{ totals().count === 1 ? "item" : "items" }})</dt>
      <dd class="m-0 font-bold">{{ taka(totals().subtotal) }}</dd>
    </div>
    <div class="flex items-center justify-between gap-4">
      <dt>Shipping</dt>
      <dd class="m-0 font-bold">{{ totals().shipping === 0 ? "Free" : taka(totals().shipping) }}</dd>
    </div>
    <div class="mt-2 flex items-center justify-between gap-4 border-t border-(--line) pt-4 text-base">
      <dt>Total</dt>
      <dd class="m-0 text-lg font-bold">{{ taka(totals().total) }}</dd>
    </div>
  `,
})
export class OrderTotals {
  readonly totals = input.required<Totals>();
  protected readonly taka = taka;
}

@Component({
  selector: "app-demo-notice",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <p class="mt-4 text-xs leading-5 text-(--muted)">
      Demo store: no delivery fee is charged, no payment is taken and no real order is placed.
    </p>
  `,
})
export class DemoNotice {}
