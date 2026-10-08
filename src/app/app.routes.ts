import type { ActivatedRouteSnapshot, Routes } from "@angular/router";
import { productDetailResolver } from "./pages/product-detail/product-detail.resolver";
import { productsResolver } from "./pages/products/products.resolver";

const sameParams = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Re-run resolvers on any param or query change and on explicit reloads ("Try again"),
 * but not when only the #fragment changes (e.g. the "written reviews" link).
 */
const unlessFragmentOnly = (from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot) =>
  from.fragment === to.fragment || !sameParams(from.params, to.params) || !sameParams(from.queryParams, to.queryParams);

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () => import("./pages/home/home.page").then((m) => m.HomePage),
  },
  {
    path: "products",
    loadComponent: () => import("./pages/products/products.page").then((m) => m.ProductsPage),
    resolve: { listing: productsResolver },
    runGuardsAndResolvers: unlessFragmentOnly,
  },
  {
    path: "products/:slug",
    loadComponent: () => import("./pages/product-detail/product-detail.page").then((m) => m.ProductDetailPage),
    resolve: { detail: productDetailResolver },
    runGuardsAndResolvers: unlessFragmentOnly,
  },
  {
    path: "cart",
    loadComponent: () => import("./pages/cart/cart.page").then((m) => m.CartPage),
  },
  {
    path: "checkout",
    loadComponent: () => import("./pages/checkout/checkout.page").then((m) => m.CheckoutPage),
  },
  {
    path: "**",
    loadComponent: () => import("./pages/status/not-found.page").then((m) => m.NotFoundPage),
  },
];
