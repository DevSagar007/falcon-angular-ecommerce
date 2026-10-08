import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Headphones, Package, UserRound } from "lucide";
import { Icon } from "../shared/ui/icon";
import { CartLink } from "./cart-link";
import { CategoryMenu } from "./category-menu";
import { HeaderSearch } from "./header-search";

const CATEGORY_LINKS = ["Electronics", "Home Appliances", "Mother & Baby", "Automotive", "Sports Gear"];

@Component({
  selector: "app-store-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, CartLink, CategoryMenu, HeaderSearch],
  host: { class: "contents" },
  template: `
    <div class="h-8.5 bg-[#00b795] px-4 py-2.25 text-center text-xs text-white">
      <a routerLink="/products">Discounts on selected products&nbsp;&nbsp; Shop Now</a>
    </div>
    <div class="bg-[#0f172a] px-0 py-5 max-[800px]:py-3.5">
      <div class="mx-auto flex w-[min(1270px,calc(100%-32px))] items-center justify-between gap-5 max-[800px]:flex-wrap">
        <a routerLink="/" class="flex min-w-45 max-[800px]:min-w-0">
          <img
            src="/assets/logo/footer-logo.png"
            alt="Falcon home"
            width="180"
            height="35"
            fetchpriority="high"
            class="h-auto object-contain max-[800px]:w-33.75"
          />
        </a>
        <form appHeaderSearch></form>
        <div class="flex items-center gap-3.5 text-white">
          <app-cart-link />
          <span class="cursor-default p-2 text-white/60" title="Accounts are not part of this demo" aria-label="Account (coming soon)" role="img">
            <svg [appIcon]="icons.UserRound" [size]="24"></svg>
          </span>
        </div>
      </div>
    </div>
    <header class="relative bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-4 max-[1200px]:gap-2 max-[800px]:items-start">
          <div class="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3 max-[1200px]:gap-x-3">
            <app-category-menu>
              @for (category of categories; track category) {
                <a routerLink="/products" [queryParams]="{ category }" class="whitespace-nowrap text-base">{{ category }}</a>
              }
            </app-category-menu>
          </div>
          <div class="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm max-[1200px]:gap-x-2 max-[1200px]:text-xs">
            <a routerLink="/products" class="flex items-center space-x-2 whitespace-nowrap font-medium max-[1200px]:space-x-1.5">
              <svg [appIcon]="icons.Package" [size]="16" [strokeWidth]="1.5"></svg> <span>TRACK ORDER</span>
            </a>
            <a routerLink="/products" class="flex items-center space-x-2 whitespace-nowrap font-medium max-[1200px]:space-x-1.5">
              <svg [appIcon]="icons.Headphones" [size]="16" [strokeWidth]="1.5"></svg> <span>HELP CENTER</span>
            </a>
            <a routerLink="/products" class="flex items-center space-x-2 whitespace-nowrap font-medium max-[1200px]:space-x-1.5">
              <img src="/assets/icons/animation.png" alt="" width="16" height="16" aria-hidden="true" /> <span>SELL WITH US</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class StoreHeader {
  protected readonly icons = { Headphones, Package, UserRound };
  protected readonly categories = CATEGORY_LINKS;
}
