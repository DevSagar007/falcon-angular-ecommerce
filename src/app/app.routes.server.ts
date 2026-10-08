import { PrerenderFallback, RenderMode, type ServerRoute } from "@angular/ssr";
import { getAllProductSlugs } from "../server/product.service";
import { warnIfSiteUrlMissing } from "../server/site";

export const serverRoutes: ServerRoute[] = [
  // Static pages; the cart and checkout render their loading skeleton and read the cart in the browser.
  { path: "", renderMode: RenderMode.Prerender },
  { path: "cart", renderMode: RenderMode.Prerender },
  { path: "checkout", renderMode: RenderMode.Prerender },
  // Depends on the query string, so it is rendered per request.
  { path: "products", renderMode: RenderMode.Server },
  {
    // All 520 product pages are prerendered at build time; unknown slugs render on demand (404 or redirect).
    path: "products/:slug",
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => {
      // Runs once per build (route extraction), so the missing-SITE_URL warning is printed once, not per worker.
      warnIfSiteUrlMissing();
      return (await getAllProductSlugs()).map((slug) => ({ slug }));
    },
  },
  { path: "**", renderMode: RenderMode.Server, status: 404 },
];
