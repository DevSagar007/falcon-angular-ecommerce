import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/** CSS-only tooltip shown on hover and keyboard focus of the wrapped control. */
@Component({
  selector: "app-tooltip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "group relative inline-flex" },
  template: `
    <ng-content />
    <span
      role="tooltip"
      class="pointer-events-none absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded bg-[#0f172a] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {{ content() }}
    </span>
  `,
})
export class Tooltip {
  readonly content = input.required<string>();
}
