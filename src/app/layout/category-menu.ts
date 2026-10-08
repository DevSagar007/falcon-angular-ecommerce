import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { Menu, X } from "lucide";
import { Icon } from "../shared/ui/icon";

/** "Categories" label plus the category links; on small screens the links become a toggled dropdown. */
@Component({
  selector: "app-category-menu",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    class: "contents",
    "(document:keydown.escape)": "open.set(false)",
  },
  template: `
    <div class="flex shrink-0 items-center space-x-2">
      <button
        type="button"
        class="flex items-center justify-center min-[801px]:hidden"
        (click)="open.set(!open())"
        [attr.aria-label]="open() ? 'Close categories' : 'Open categories'"
        [attr.aria-expanded]="open()"
        aria-controls="categories-nav"
      >
        <svg [appIcon]="open() ? icons.X : icons.Menu" [size]="24" [strokeWidth]="1.5" class="text-[#00a788]"></svg>
      </button>
      <svg [appIcon]="icons.Menu" [size]="24" [strokeWidth]="1.5" class="text-[#00a788] max-[800px]:hidden"></svg>
      <span class="whitespace-nowrap text-lg font-medium text-[#0f172a] max-[1200px]:text-base">Categories</span>
    </div>
    <!-- Closing on link click covers client-side navigation within the menu (Enter on a link also fires click). -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- delegated from the focusable links -->
    <nav
      id="categories-nav"
      aria-label="Categories"
      (click)="onNavClick($event)"
      [class]="open() ? 'flex ' + navClass : 'hidden ' + navClass"
    >
      <ng-content />
    </nav>
  `,
})
export class CategoryMenu {
  protected readonly icons = { Menu, X };
  protected readonly open = signal(false);
  protected readonly navClass =
    "absolute left-4 right-4 top-full z-10 max-h-[calc(100vh-120px)] flex-col gap-4 overflow-y-auto bg-white p-4.5 shadow-[0_8px_25px_rgba(15,23,42,.13)] min-[801px]:static min-[801px]:flex min-[801px]:max-h-none min-[801px]:flex-row min-[801px]:flex-wrap min-[801px]:gap-8 min-[801px]:overflow-visible min-[801px]:bg-transparent min-[801px]:p-0 min-[801px]:shadow-none max-[1200px]:gap-3";

  protected onNavClick(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("a")) this.open.set(false);
  }
}
