import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

export type BreadcrumbItem = { label: string; href?: string; queryParams?: Record<string, string> };

@Component({
  selector: "nav[appBreadcrumb]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    "aria-label": "Breadcrumb",
    class: "mx-auto mt-3 mb-6 w-full max-w-7xl",
  },
  template: `
    <ol class="m-0 flex min-w-0 list-none items-center space-x-2 overflow-hidden p-0 text-sm leading-5">
      @for (item of items(); track $index; let first = $first) {
        <li class="flex min-w-0 items-center space-x-2">
          @if (!first) {
            <span aria-hidden="true" class="shrink-0 text-[#94a3b8]">›</span>
          }
          @if (item.href) {
            <a [routerLink]="item.href" [queryParams]="item.queryParams" class="whitespace-nowrap">{{ item.label }}</a>
          } @else {
            <span class="truncate text-[#475569]" aria-current="page">{{ item.label }}</span>
          }
        </li>
      }
    </ol>
  `,
})
export class Breadcrumb {
  readonly items = input.required<BreadcrumbItem[]>();
}
