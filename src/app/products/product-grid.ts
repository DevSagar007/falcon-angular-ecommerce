import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Product } from "../../types/product";
import { ProductCard } from "./product-card";

@Component({
  selector: "app-product-grid",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard],
  host: {
    class: "grid grid-cols-[repeat(4,1fr)] gap-4.5 max-[1081px]:grid-cols-3 max-[601px]:grid-cols-2 max-[601px]:gap-3",
  },
  template: `
    @for (p of items(); track p.id) {
      <article appProductCard [product]="p" [priority]="$index < priorityCount()"></article>
    }
  `,
})
export class ProductGrid {
  readonly items = input.required<Product[]>();
  /** How many leading cards get a preloaded image. */
  readonly priorityCount = input(0);
}
