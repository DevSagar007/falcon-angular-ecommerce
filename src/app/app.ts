import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject } from "@angular/core";
import { ViewportScroller } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router, RouterOutlet, Scroll } from "@angular/router";
import { filter } from "rxjs";
import { CartStore } from "./core/cart.store";
import { StoreFooter } from "./layout/store-footer";
import { StoreHeader } from "./layout/store-header";

/** Root layout: header, routed page, footer. Every page renders its own <main>. */
@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, StoreHeader, StoreFooter],
  template: `
    <app-store-header />
    <router-outlet />
    <app-store-footer />
  `,
})
export class App {
  constructor() {
    const cart = inject(CartStore);
    const destroyRef = inject(DestroyRef);
    // Load the persisted cart only after the first browser render, so hydration matches the server HTML.
    afterNextRender(() => cart.connect(destroyRef));

    // Scrolling: restore the position on back/forward, follow #fragments, otherwise go to the top,
    // except for in-page filter changes, which navigate with `info: { scroll: false }`.
    const router = inject(Router);
    const scroller = inject(ViewportScroller);
    router.events
      .pipe(
        filter((event): event is Scroll => event instanceof Scroll),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (event.position) return scroller.scrollToPosition(event.position);
        if (event.anchor) return scroller.scrollToAnchor(event.anchor);
        const info = router.lastSuccessfulNavigation()?.extras.info as { scroll?: boolean } | undefined;
        if (info?.scroll !== false) scroller.scrollToPosition([0, 0]);
      });
  }
}
