import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Search } from "lucide";
import { Icon } from "../shared/ui/icon";

@Component({
  selector: "form[appHeaderSearch]",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    role: "search",
    class: "relative mx-auto flex w-[min(762px,58vw)] max-[800px]:order-3 max-[800px]:w-full",
    "(submit)": "submit($event)",
  },
  template: `
    <label for="header-search" class="sr-only">Search products</label>
    <input
      id="header-search"
      type="search"
      [value]="term()"
      (input)="term.set($any($event.target).value)"
      placeholder="Search for anything...."
      maxlength="100"
      class="h-12 w-full rounded-lg border-0 bg-white px-4 pr-14 text-[#0f172a] outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[#00b795]"
    />
    <button
      type="submit"
      aria-label="Search"
      class="absolute right-0 top-0 grid h-12 w-12 place-items-center rounded-r-lg bg-[#00b795] text-white transition-colors hover:bg-[#009c80]"
    >
      <svg [appIcon]="icons.Search" [size]="21"></svg>
    </button>
  `,
})
export class HeaderSearch {
  private readonly router = inject(Router);
  protected readonly icons = { Search };
  protected readonly term = signal("");

  protected submit(event: Event) {
    event.preventDefault();
    const search = this.term().trim();
    void this.router.navigate(["/products"], { queryParams: search ? { search } : {} });
  }
}
