import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide";
import { productsHref } from "../../../lib/product-query";
import { cn, taka } from "../../../lib/utils";
import type { ProductListResult } from "../../../types/product";
import { ProductGrid } from "../../products/product-grid";
import { Breadcrumb } from "../../shared/ui/breadcrumb";
import { Button, buttonVariants } from "../../shared/ui/button";
import { Icon } from "../../shared/ui/icon";
import { Input } from "../../shared/ui/input";
import { Select, type SelectOption } from "../../shared/ui/select";
import { Skeleton } from "../../shared/ui/skeleton";
import { PriceInput, isValidPrice } from "./price-input";
import { toURLSearchParams } from "./products.resolver";

const SKELETON_COUNT = 8;
const DEBOUNCE_MS = 350;

const SORT_LABELS: Record<string, string> = {
  featured: "Sort by: Featured",
  "price-low": "Price: low to high",
  "price-high": "Price: high to low",
  rating: "Top rated",
};

const RATING_LABELS: Record<string, string> = {
  any: "Any rating",
  "4": "4+ stars",
  "4.5": "4.5+ stars",
};

const toOptions = (labels: Record<string, string>): SelectOption[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const TEXT_KEYS = ["search", "minPrice", "maxPrice"] as const;
type TextKey = (typeof TEXT_KEYS)[number];
type Drafts = Record<TextKey, string>;

function paginationItems(current: number, total: number) {
  const pages: (number | "gap")[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) pages.push("gap");
  for (let page = from; page <= to; page += 1) pages.push(page);
  if (to < total - 1) pages.push("gap");
  if (total > 1) pages.push(total);
  return pages;
}

const readDrafts = (params: URLSearchParams): Drafts => ({
  search: params.get("search") ?? "",
  minPrice: params.get("minPrice") ?? "",
  maxPrice: params.get("maxPrice") ?? "",
});

const keyOf = (drafts: Drafts) => TEXT_KEYS.map((key) => drafts[key]).join("\u0000");

/** Invalid price drafts are not pushed; the URL keeps its current value for that field. */
function committable(drafts: Drafts, url: Drafts): Drafts {
  return {
    search: drafts.search,
    minPrice: isValidPrice(drafts.minPrice) ? drafts.minPrice.trim() : url.minPrice,
    maxPrice: isValidPrice(drafts.maxPrice) ? drafts.maxPrice.trim() : url.maxPrice,
  };
}

const isModifiedClick = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

const PAGINATION_LINK =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-(--line) bg-white px-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Search, filters, sorting and pagination for the listing. The URL is the single source of truth:
 * selects navigate immediately; the text fields keep local drafts that are committed to the URL
 * together after a pause (see the constructor), so quick edits to several fields can't overwrite each other.
 */
@Component({
  selector: "app-product-browser",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ProductGrid, Breadcrumb, Button, Icon, Input, Select, Skeleton, PriceInput],
  host: { class: "contents" },
  template: `
    @let res = result();
    <main class="mx-auto my-17.5 w-[calc(100%-32px)] max-w-317.5">
      <nav appBreadcrumb [items]="breadcrumb"></nav>
      <div class="mb-8.75 flex items-end justify-between">
        <div>
          <h1 class="text-[clamp(45px,5vw,74px)] leading-[1.04] tracking-[-3px] max-[601px]:tracking-[-1.5px]">
            Find your <em class="font-normal text-(--teal)">everyday</em>
          </h1>
        </div>
      </div>

      <div class="mb-6.5 flex justify-between border-y border-(--line) py-3 max-[601px]:flex-col max-[601px]:gap-2.5">
        <div class="flex h-10 w-90 items-center gap-2 rounded-md border border-(--line) bg-white px-3 max-[601px]:w-full">
          <svg [appIcon]="icons.Search" [size]="18" class="shrink-0 text-(--muted)"></svg>
          <input
            appInput
            type="search"
            class="h-9 min-w-0 border-0 bg-transparent px-0 shadow-none focus:border-transparent focus:ring-0"
            [value]="drafts().search"
            (input)="setDraft('search', $any($event.target).value)"
            placeholder="Search products..."
            aria-label="Search products"
            maxlength="100"
          />
        </div>
        <app-select
          aria-label="Sort products"
          [value]="res.query.sort"
          [options]="sortOptions"
          (valueChange)="setFilter('sort', $event === 'featured' ? '' : $event)"
        />
      </div>

      <div class="grid grid-cols-[190px_1fr] gap-8.75 max-[901px]:grid-cols-1 max-[901px]:gap-5">
        <aside
          class="h-max rounded-[5px] bg-white p-4.5 max-[901px]:grid max-[901px]:grid-cols-2 max-[901px]:gap-x-4"
          aria-label="Product filters"
        >
          <div class="flex justify-between border-b border-(--line) pb-3.5 text-[13px] max-[901px]:col-span-full">
            <b class="flex items-center gap-1.5"><svg [appIcon]="icons.SlidersHorizontal" [size]="16"></svg> Filters</b>
            <button appButton class="text-[11px]" type="button" variant="link" (click)="clear()" [disabled]="!hasFilters()">Clear</button>
          </div>
          <label class="mt-5.5 block text-[12px] text-[#475569]">
            Category
            <app-select
              triggerClass="mt-1.75"
              [value]="category()"
              [options]="categoryOptions()"
              (valueChange)="setFilter('category', $event === 'all' ? '' : $event)"
            />
          </label>
          <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the PriceInput label renders its own <input> -->
          <label
            appPriceInput
            label="Minimum price"
            inputId="min-price"
            placeholder="৳0"
            [value]="drafts().minPrice"
            (valueChange)="setDraft('minPrice', $event)"
          ></label>
          <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -- the PriceInput label renders its own <input> -->
          <label
            appPriceInput
            label="Maximum price"
            inputId="max-price"
            placeholder="৳100000"
            [value]="drafts().maxPrice"
            (valueChange)="setDraft('maxPrice', $event)"
          ></label>
          @if (swapped()) {
            <p class="mt-2 text-xs leading-5 text-amber-700 max-[901px]:col-span-full" role="status">
              Minimum was above maximum, so showing {{ taka(res.query.minPrice!) }}–{{ taka(res.query.maxPrice!) }}.
            </p>
          }
          <label class="mt-5.5 block text-[12px] text-[#475569]">
            Rating
            <app-select
              triggerClass="mt-1.75"
              [value]="ratingValue()"
              [options]="ratingOptions"
              (valueChange)="setFilter('rating', $event === 'any' ? '' : $event)"
            />
          </label>
        </aside>

        <section class="results" aria-label="Products" [attr.aria-busy]="isPending()">
          <div class="mb-3.75 flex justify-between text-[13px] text-(--muted)" role="status">
            <span>{{ res.total }} {{ res.total === 1 ? "product" : "products" }}</span>
            @if (res.total > 0) {
              <span>Page {{ res.page }} of {{ res.totalPages }}</span>
            }
          </div>

          @if (isPending()) {
            <div class="grid grid-cols-[repeat(4,1fr)] gap-4.5 max-[1081px]:grid-cols-3 max-[601px]:grid-cols-2 max-[601px]:gap-3" aria-hidden="true">
              @for (i of skeletons; track i) {
                <div
                  appSkeleton
                  class="aspect-square animate-[shine_1.2s_infinite] bg-transparent bg-[linear-gradient(90deg,#e2e8f0,#f8fafc,#e2e8f0)] bg-size-[200%]"
                ></div>
              }
            </div>
          } @else if (res.items.length > 0) {
            <app-product-grid [items]="res.items" [priorityCount]="4" />
          } @else {
            <div class="rounded-[7px] bg-white px-5 py-20 text-center">
              <h2>No products found</h2>
              <p>Try a different search, widen the price range or clear the filters.</p>
            </div>
          }

          @if (res.totalPages > 1) {
            <nav role="navigation" aria-label="Pagination" data-slot="pagination" class="my-10 flex w-full items-center justify-center">
              <ul data-slot="pagination-content" class="flex flex-row items-center gap-2">
                <li data-slot="pagination-item">
                  <ng-container *ngTemplateOutlet="arrow; context: { direction: 'previous', page: res.page - 1, disabled: res.page <= 1 }" />
                </li>
                @for (item of pages(); track $index) {
                  @if (item === "gap") {
                    <li data-slot="pagination-item" aria-hidden="true">
                      <span class="flex w-7.5 items-center justify-center text-(--muted)">…</span>
                    </li>
                  } @else {
                    <li data-slot="pagination-item">
                      <a
                        data-slot="pagination-link"
                        [class]="linkClass(item === res.page)"
                        [attr.aria-current]="item === res.page ? 'page' : null"
                        [href]="pageHref(item)"
                        (click)="onPageClick($event, item)"
                        [attr.aria-label]="'Page ' + item"
                        >{{ item }}</a
                      >
                    </li>
                  }
                }
                <li data-slot="pagination-item">
                  <ng-container *ngTemplateOutlet="arrow; context: { direction: 'next', page: res.page + 1, disabled: res.page >= res.totalPages }" />
                </li>
              </ul>
            </nav>
          }
        </section>
      </div>
    </main>

    <ng-template #arrow let-direction="direction" let-page="page" let-disabled="disabled">
      @let label = direction === "previous" ? "Previous page" : "Next page";
      @let icon = direction === "previous" ? icons.ChevronLeft : icons.ChevronRight;
      @if (disabled) {
        <span data-slot="pagination-link" [class]="linkClass(false, 'pointer-events-none opacity-40')" aria-disabled="true" [attr.aria-label]="label">
          <svg [appIcon]="icon" [size]="16"></svg>
        </span>
      } @else {
        <a
          data-slot="pagination-link"
          [class]="linkClass(false)"
          [href]="pageHref(page)"
          (click)="onPageClick($event, page)"
          [attr.aria-label]="label"
          [attr.rel]="direction === 'previous' ? 'prev' : 'next'"
        >
          <svg [appIcon]="icon" [size]="16"></svg>
        </a>
      }
    </ng-template>
  `,
})
export class ProductBrowser {
  readonly result = input.required<ProductListResult>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly icons = { ChevronLeft, ChevronRight, Search, SlidersHorizontal };
  protected readonly taka = taka;
  protected readonly breadcrumb = [{ label: "Home", href: "/" }, { label: "Shop" }];
  protected readonly sortOptions = toOptions(SORT_LABELS);
  protected readonly ratingOptions = toOptions(RATING_LABELS);
  protected readonly skeletons = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

  /** The current URL's query, which may run ahead of `result` while a navigation is pending. */
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly params = computed(() => toURLSearchParams(this.queryParamMap()));

  /** True while a navigation started here is loading, like a React transition: shows the skeleton grid. */
  protected readonly isPending = signal(false);
  private navigationId = 0;

  // Free-text filter drafts (search, min, max), committed to the URL together after a pause.
  private readonly urlDrafts = computed(() => readDrafts(this.params()));
  protected readonly drafts = signal<Drafts>(this.urlDrafts());
  private readonly committedKey = signal<string | null>(null);
  private seenUrlKey = keyOf(this.urlDrafts());
  /** Drafts as they would be committed now; select changes carry them so a pending search isn't dropped. */
  private readonly pendingText = computed(() => committable(this.drafts(), this.urlDrafts()));

  protected readonly category = computed(() => this.result().query.category ?? "all");
  protected readonly categoryOptions = computed<SelectOption[]>(() => [
    { value: "all", label: "All categories" },
    ...this.result().categories.map((c) => ({ value: c, label: c })),
  ]);
  protected readonly ratingValue = computed(() => {
    const rating = this.params().get("rating") ?? "";
    return rating in RATING_LABELS ? rating : "any";
  });
  protected readonly pages = computed(() => paginationItems(this.result().page, this.result().totalPages));
  protected readonly swapped = computed(() => {
    const { minPrice, maxPrice } = this.result().query;
    const rawMin = Number(this.params().get("minPrice"));
    const rawMax = Number(this.params().get("maxPrice"));
    return minPrice !== undefined && maxPrice !== undefined && rawMin > rawMax;
  });
  protected readonly hasFilters = computed(() => this.params().toString() !== "");

  constructor() {
    // Re-sync drafts only when the URL changes from outside (back/forward, header search, "Clear"),
    // not when it catches up with a commit made here.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const url = readDrafts(toURLSearchParams(params));
      const urlKey = keyOf(url);
      if (urlKey === this.seenUrlKey) return;
      this.seenUrlKey = urlKey;
      if (urlKey !== this.committedKey()) {
        this.drafts.set(url);
        this.committedKey.set(null);
      }
    });

    effect((onCleanup) => {
      const next = this.pendingText();
      const nextKey = keyOf(next);
      if (nextKey === keyOf(this.urlDrafts()) || nextKey === this.committedKey()) return;
      const timer = setTimeout(() => {
        this.committedKey.set(nextKey);
        // Text filters replace the history entry so typing doesn't create one entry per pause.
        this.go(productsHref(this.params(), { ...next, page: null }), { replaceUrl: true, scroll: false });
      }, DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected setDraft(key: TextKey, value: string) {
    this.drafts.update((current) => ({ ...current, [key]: value }));
  }

  protected setFilter(key: string, value: string) {
    this.go(productsHref(this.params(), { ...this.pendingText(), [key]: value, page: null }), { scroll: false });
  }

  protected clear() {
    this.go("/products", { scroll: false });
  }

  protected pageHref(page: number) {
    return productsHref(this.params(), { page: page > 1 ? String(page) : null });
  }

  /** Pagination items are real links (crawlers, middle-click, no-JS); plain clicks navigate in-app. */
  protected onPageClick(event: MouseEvent, page: number) {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    this.go(this.pageHref(page));
  }

  protected linkClass(active: boolean, extra = "") {
    return cn(
      buttonVariants({ variant: active ? "outline" : "ghost", size: "icon" }),
      PAGINATION_LINK,
      active && "active border-(--teal) bg-(--teal) text-white hover:bg-[#009c80]",
      extra,
    );
  }

  private go(href: string, options: { replaceUrl?: boolean; scroll?: boolean } = {}) {
    const id = ++this.navigationId;
    this.isPending.set(true);
    void this.router
      .navigateByUrl(href, { replaceUrl: options.replaceUrl, info: { scroll: options.scroll ?? true } })
      .finally(() => {
        if (id === this.navigationId) this.isPending.set(false);
      });
  }
}
