import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { Star } from "lucide";
import { Icon } from "../shared/ui/icon";

/** Five Lucide stars filled to the exact rating (4.8 fills 80% of the fifth), with an accessible label. */
@Component({
  selector: "app-rating-stars",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    role: "img",
    "[attr.aria-label]": "'Rated ' + rating() + ' out of 5'",
    class: "inline-flex items-center gap-px",
  },
  template: `
    @for (fill of fills(); track $index) {
      <span class="relative inline-flex shrink-0" aria-hidden="true">
        <svg [appIcon]="star" [size]="size()" fill="currentColor" class="text-(--line)"></svg>
        @if (fill > 0) {
          <span class="absolute inset-y-0 left-0 overflow-hidden" [style.width.%]="fill * 100">
            <svg [appIcon]="star" [size]="size()" fill="currentColor" class="max-w-none shrink-0 text-[#f59e0b]"></svg>
          </span>
        }
      </span>
    }
  `,
})
export class RatingStars {
  readonly rating = input.required<number>();
  readonly size = input(16);

  protected readonly star = Star;
  protected readonly fills = computed(() => {
    const value = Math.min(5, Math.max(0, this.rating()));
    return Array.from({ length: 5 }, (_, i) => Math.min(1, Math.max(0, value - i)));
  });
}

export function reviewLabel(count: number) {
  return `${count} written ${count === 1 ? "review" : "reviews"}`;
}
