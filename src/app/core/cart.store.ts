import { DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import {
  addItem,
  changeQuantity,
  sanitizeCartItems,
  syncWithCatalog,
  type CartItem,
  type CartProduct,
} from "../../lib/cart";

export type { CartItem, CartProduct };

export const CART_STORAGE_KEY = "ecommerce-task-cart";
/** Same envelope the previous (zustand `persist`) version wrote, so existing carts survive the migration. */
const STORAGE_VERSION = 2;

/**
 * Cart state as signals, persisted to localStorage.
 * Nothing is read during server rendering or hydration: `connect()` loads the stored cart after the
 * first browser render, so the hydrated markup matches the server HTML, and `hydrated` lets pages
 * show a skeleton instead of briefly flashing "empty cart".
 */
@Injectable({ providedIn: "root" })
export class CartStore {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<CartItem[]>([]);
  private readonly loaded = signal(false);

  readonly items = this.state.asReadonly();
  /** False until the persisted cart has been read. */
  readonly hydrated = this.loaded.asReadonly();
  readonly count = computed(() => this.state().reduce((sum, item) => sum + item.quantity, 0));

  /** Loads the persisted cart and keeps it in sync when another tab changes it. Browser only. */
  connect(destroyRef: DestroyRef) {
    if (!this.isBrowser) return;
    this.rehydrate();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) this.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    destroyRef.onDestroy(() => window.removeEventListener("storage", onStorage));
  }

  add(product: CartProduct, quantity = 1) {
    this.update((items) => addItem(items, product, quantity));
  }

  remove(id: string) {
    this.update((items) => items.filter((item) => item.id !== id));
  }

  inc(id: string) {
    this.update((items) => changeQuantity(items, id, 1));
  }

  dec(id: string) {
    this.update((items) => changeQuantity(items, id, -1));
  }

  clear() {
    this.update(() => []);
  }

  syncCatalog(catalog: Record<string, CartProduct | null>) {
    this.update((items) => syncWithCatalog(items, catalog));
  }

  private update(change: (items: CartItem[]) => CartItem[]) {
    // A write before the stored cart was read would otherwise overwrite it.
    if (this.isBrowser && !this.loaded()) this.rehydrate();
    this.state.update(change);
    this.persist();
  }

  private rehydrate() {
    let items: CartItem[] = [];
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      // v1 stored whole Product objects; sanitizing keeps only valid CartItem fields.
      if (raw) items = sanitizeCartItems((JSON.parse(raw) as { state?: { items?: unknown } } | null)?.state?.items);
    } catch {
      // Unparseable JSON or blocked storage: start with an empty cart.
    }
    this.state.set(items);
    this.loaded.set(true);
  }

  private persist() {
    if (!this.isBrowser) return;
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ state: { items: this.state() }, version: STORAGE_VERSION }),
      );
    } catch {
      // Storage full or blocked: the cart still works for this page view.
    }
  }
}
