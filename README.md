# Falcon — E-commerce Product Search & Checkout

An Angular storefront built for the *Task 2 — E-Commerce Product Search & Checkout* frontend assignment. It covers browsing and filtering a 520-product catalog, product detail pages, a persistent cart, and a validated mock checkout.

**Live demo:** https://falcon-angular-ecommerce.vercel.app/ (this URL predates the Angular migration, and this repository contains no deployment configuration; see [Deployment](#deployment))

**Stack:** Angular 22 (standalone components, signals, zoneless, SSR + prerendering with `@angular/ssr` and Express) · TypeScript (strict) · Tailwind CSS 4 · Angular CDK (overlay, listbox) · Reactive Forms + Zod 4 · Lucide icons

## Requirements coverage

| Assignment requirement | Where it is handled |
| --- | --- |
| 500+ products from a JSON dataset or mock API | `data/products.json` (48 seeds) expanded to 520 products in `src/server/product.service.ts`, served at `/api/products` |
| Search, category, price, rating, sorting, pagination | `getProducts()` in the service, with controls in `ProductBrowser` |
| URL-based filters that survive a refresh | `src/lib/product-query.ts` and `ProductBrowser` (see [URL-based filters](#url-based-filters)) |
| Product details with images, stock, reviews, related products | `src/app/pages/product-detail/`, `getRelatedProducts()` |
| Cart with add, remove, quantity and persistence | `CartStore` (`src/app/core/cart.store.ts`, signals + localStorage), `src/lib/cart.ts`, `CartPage` |
| Checkout with form validation | `CheckoutPage` (Reactive Forms validated by `src/schemas/checkout.schema.ts`), `POST /api/orders` |
| SEO-friendly product pages | Per-product title/meta, canonical URLs, JSON-LD, sitemap (see [SEO](#seo)) |
| Loading, empty and error states | See [Error, loading and empty states](#error-loading-and-empty-states) |
| API service layer kept out of components | `src/server/` (catalog, orders, API handler) and `CatalogApi` on the client |

## Setup

Requires Node.js `^22.22.3 || ^24.15.0 || >=26` (Angular 22's supported range, also declared in `package.json` `engines`). On Node 26 the build prints a harmless `[DEP0205]` warning (see [Build warnings](#build-warnings)).

```bash
npm install
npm run dev        # http://localhost:3000 (dev server with SSR)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Angular dev server with server-side rendering and the mock API |
| `npm run build` | Production build: browser + server bundles, prerenders `/`, `/cart`, `/checkout` and all 520 product pages |
| `npm start` | Serves the production build (`dist/falcon-angular-ecommerce/server/server.mjs`) on `PORT` (default 3000), with `NODE_ENV=production` unless you set it yourself |
| `npm run lint` | ESLint with angular-eslint (TypeScript, template and template-accessibility rules) |
| `npm run typecheck` | `ngc -p tsconfig.app.json --noEmit`: TypeScript plus Angular template type checking, without output |
| `npm run format` / `npm run format:check` | Prettier (double quotes, 120 columns) |

On machines with little free memory the build can intermittently run out of heap because the builder starts one worker per CPU core. Limit the workers with `NG_BUILD_MAX_WORKERS=2 npm run build` (PowerShell: `$env:NG_BUILD_MAX_WORKERS=2; npm run build`).

### Environment variables

None are required. See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Public origin (scheme + host, no path) used for canonical URLs, Open Graph tags, JSON-LD, `sitemap.xml` and `robots.txt`, e.g. `https://falcon-angular-ecommerce.vercel.app`. **Required for a real deployment, and needed at both build time and server startup** (see [Setting `SITE_URL`](#setting-site_url)). `NEXT_PUBLIC_SITE_URL` and Vercel's `VERCEL_PROJECT_PRODUCTION_URL` are still honoured as fallbacks; otherwise it defaults to `http://localhost:3000`, and production builds and the production server print a warning. |
| `PORT` | Port for `npm start` (default 3000). |
| `NG_ALLOWED_HOSTS` | Extra host names the SSR server accepts. `localhost`, `127.0.0.1` and the demo domain are allowed in `angular.json` (`security.allowedHosts`); other `Host` headers are rejected to prevent SSRF. |

## Architecture

```
src/
  main.ts / main.server.ts     Browser and server bootstrap
  server.ts                    Express: /api/*, robots.txt, sitemap.xml, static files, Angular SSR
  index.html
  styles/                      globals.css (Tailwind entry) and variables.css (design tokens)
  app/
    app.ts                     Root layout: header, <router-outlet>, footer; cart hydration; scroll handling
    app.config.ts              Router, hydration (with HTTP transfer cache), HttpClient (fetch), image loader
    app.config.server.ts       SSR providers: server routes, in-process API backend, SITE_URL
    app.routes.ts              Lazy-loaded page routes and resolvers
    app.routes.server.ts       Render mode per route (prerender / server)
    core/
      cart.store.ts            Cart state (signals), persisted to localStorage, cross-tab sync
      catalog-api.ts           HttpClient wrapper for the mock REST API
      in-process-api.backend.ts  Server-only HttpBackend that answers /api/* without a network hop
      seo.service.ts           Title, meta, Open Graph, canonical link, JSON-LD
      site-url.ts, image-loader.ts
    layout/                    StoreHeader (+ HeaderSearch, CartLink, CategoryMenu), StoreFooter
    products/                  ProductCard, ProductGrid, ProductActions, RatingStars
    cart/                      OrderTotals, DemoNotice (shared by cart and checkout)
    shared/ui/                 Button, Input, Badge, Skeleton, Breadcrumb, Tooltip, Select, Icon
    pages/
      home/                    HomePage
      products/                ProductsPage, ProductBrowser, PriceInput, productsResolver
      product-detail/          ProductDetailPage, productDetailResolver
      cart/                    CartPage, CartLine
      checkout/                CheckoutPage
      status/                  NotFoundPage, RouteError, StatusMessage
  server/
    product.service.ts         Catalog, filtering → sorting → pagination, details, related products
    order.service.ts           Re-prices and stock-checks a cart against the catalog
    place-order.ts             Simulated order placement with server-side validation
    api.ts                     Mock REST API handler shared by Express and the SSR backend
    site.ts                    SITE_URL from the environment
  lib/
    product-query.ts           Parses and normalizes URL query params (shared by pages and API)
    cart.ts                    Pure cart operations and persisted-data sanitizing
    pricing.ts                 Cart totals, shipping fee, discount calculation
    utils.ts                   cn(), taka(), productPath()
  schemas/checkout.schema.ts   Zod schemas: delivery form and order lines (client and server)
  types/                       Product, review, query, result and order types
data/products.json             48 hand-written seed products
public/                        Static assets (logo, icons, payment logos, favicon)
```

All components are standalone and use `OnPush` change detection with signals; the app runs without Zone.js. UI code never imports the dataset: the browser goes through `CatalogApi` (HTTP), and only `src/server/` touches `data/products.json`. The pure logic in `lib/` and `schemas/` has no framework dependency.

## Data and API

- **Dataset.** `data/products.json` holds 48 seed products. `product.service.ts` expands them deterministically into 520 products ("Edition N" variants) with varied prices and stock.
  - Each old price keeps its seed's discount ratio, so `originalPrice` is never below the current price.
  - Written reviews stay on the original product only; editions are not given copies of another product's reviews.
- **Service layer.** `getProducts(query)` filters (search, category, price range, rating), then sorts, then paginates. Sorting falls back to product id, so the order is deterministic. `getRelatedProducts` returns the best-rated products in the same category and excludes other editions of the same product.
- **How pages get data.** Route resolvers call `CatalogApi`. During server rendering (and build-time prerendering) the server swaps in `InProcessApiBackend`, which answers `/api/*` by calling the same handler Express uses, so there is no HTTP round trip. Angular's HTTP transfer cache embeds those responses in the HTML, so hydration does not fetch them again, and the browser only receives the products on the current page.
- **Mock REST API** (`src/server/api.ts`, same parser and service):
  - `GET /api/products?search=&category=&minPrice=&maxPrice=&rating=&sort=&page=&limit=` returns `{ items, total, page, limit, totalPages, categories, query }`, where `query` is the normalized query that was actually applied.
  - `GET /api/products/:idOrSlug` returns the product, or 404.
  - `GET /api/products/:idOrSlug/related` returns `{ items }`, or 404.
  - `POST /api/orders` with `{ customer, lines }` returns `{ ok: true, orderId, total, count }` or `{ ok: false, error, catalog? }`.

### Query parameter rules (`src/lib/product-query.ts`)

| Input | Behaviour |
| --- | --- |
| `minPrice` / `maxPrice` negative, non-numeric, `1e3` | Ignored |
| `minPrice` > `maxPrice` | Swapped; the UI explains which range is shown |
| `sort` not one of `featured`, `price-low`, `price-high`, `rating` | Uses `featured` |
| `rating` | Clamped to 0–5 |
| `category` | Matched case-insensitively; unknown categories are ignored |
| `page` malformed or out of range | The listing **redirects** (307) to the page actually shown (`?page=999` → last page) |
| `limit` (API only) | Clamped to 1–48 |
| `search` | Trimmed, at most 100 characters |

## URL-based filters

The URL is the single source of truth for search, category, price, rating, sort and page. That gives refresh persistence, shareable links, and browser back/forward support.

- Selects (category, sort, rating) push a new history entry immediately.
- Text fields (search, minimum and maximum price) keep a local draft (a signal) and commit **together** after 350 ms with `replaceUrl`. Committing them together means quick edits to two fields can't overwrite each other from a stale URL, and typing doesn't add a history entry per keystroke. Drafts re-sync from the URL only when it changes from outside (back/forward, header search, Clear). Invalid prices show an inline error and aren't committed.
- A select change also carries any text draft that hasn't been committed yet, so changing the category while a search is still debouncing doesn't drop the search.
- Every filter change removes `page`; every other active parameter is kept.
- Pagination items are real `<a href>` links, so they work for crawlers, middle-click and no-JS. Plain clicks navigate in-app and show the skeleton grid while the next page loads.
- Filter changes keep the scroll position; pagination scrolls to the top; back/forward restores the previous position.
- Filtered listing URLs are `noindex, follow` and canonicalize to `/products` (or `/products?page=N`).

## Rendering

| Route | Render mode |
| --- | --- |
| `/`, `/cart`, `/checkout` | Prerendered at build time (the cart and checkout show a skeleton until the stored cart is read in the browser) |
| `/products/:slug` | All 520 pages prerendered; unknown slugs are rendered on demand with a real 404, and legacy `/products/prod-001` URLs return a 308 redirect to the slug |
| `/products` | Server-rendered per request (depends on the query string) |
| anything else | Server-rendered 404 page |

Client hydration uses event replay, so clicks made before the app finishes hydrating are not lost.

## Cart state and persistence

- `CartStore` holds the items in a signal and persists them to localStorage under `falcon-angular-ecommerce-cart` in the same `{ state: { items }, version: 2 }` format the previous version wrote, so existing carts survive the migration.
- **Hydration.** Nothing is read during server rendering or hydration; the App component loads the stored cart in `afterNextRender`, so the hydrated markup matches the server HTML. A `hydrated` signal lets the cart and checkout show a skeleton instead of briefly flashing "empty cart". A `storage` listener keeps tabs in sync and is removed on destroy.
- **Stored shape.** Only the fields the cart needs (`id, slug, name, image, category, price, stock, quantity`); descriptions and reviews are not persisted.
- **Invalid or outdated data.** Stored items pass through `sanitizeCartItems`, which drops malformed or duplicate entries and re-clamps quantities to 1…stock. Unparseable JSON or blocked storage results in an empty cart.
- **Rules.** Adding the same product again increases its quantity. Quantity is always between 1 and stock. Out-of-stock products can't be added.
- **Rendering.** The header badge reads a `computed` count. Cart lines are `OnPush` components with immutable item inputs, so changing one quantity re-renders only that line.

## Checkout

- Reactive Forms, with each control validated by the matching field of the shared Zod `checkoutSchema` (first message per field). Errors appear after a field is first left, then update on every change. The schema targets Bangladesh, matching the ৳ prices and Dhaka address:
  - Text fields are trimmed, so whitespace-only input counts as missing; length limits apply.
  - Email must be valid.
  - Phone must be a BD mobile number (`01XXXXXXXXX`, optional `+880`, spaces and dashes allowed).
  - Postal code must be 4 digits.
- Accessibility: every input has a `<label>`, the right `type`, `autocomplete` and `inputmode`, plus `aria-invalid`. Errors are linked with `aria-describedby`, and the first invalid field gets focus on submit.
- **Simulated order.** `POST /api/orders` re-validates the form and order lines on the server, then calls `checkOrder`, which re-prices every line from the catalog and checks stock.
  - If the persisted cart is outdated (price changed, stock reduced, product gone), the order is rejected, the cart is updated from the returned catalog data, and the user reviews it before resubmitting.
  - Nothing is stored, charged or sent anywhere. The confirmation shows a `DEMO-XXXXXXXX` reference.
- The submit button is disabled while submitting and re-entry is ignored, so a double click places one order.
- The cart is cleared **only after** a successful response. On a network error the cart is kept and an error is shown.
- **Shipping.** This is a demo store, so the shipping fee is ৳0 (`SHIPPING_FEE` in `src/lib/pricing.ts`). Cart, checkout and the server check all use the same `cartTotals()`, so subtotal + shipping = total everywhere, and the summary says that no fee, payment or real order is involved.

## SEO

- Per-page `title` (`"<page> | Falcon"`), `description`, Open Graph tags, and an absolute canonical URL, set by `SeoService` on the server and on client-side navigation.
- `Product` JSON-LD (with `<` escaped). It contains name, description, image, SKU, category, and an offer with BDT price and availability; the written reviews are included only when a product has them. It intentionally has **no** `aggregateRating` or `brand`, because the catalog has no review counts or brand data to back them.
- `sitemap.xml` (home, listing, 520 products) and `robots.txt` (disallows cart, checkout and the API) are served by Express.
- Cart, checkout and 404 pages are `noindex`. The product 404 and the generic 404 are separate pages and return HTTP 404.

## Performance decisions

- **Server-first.** Filtering and pagination run on the server; the client gets one page of results. Pages are lazy-loaded route chunks.
- **Prerendering** for the home, cart, checkout and every product page; only the listing is rendered per request.
- **No double fetch.** Data loaded during server rendering is transferred to the browser with the HTML.
- **Signals and `OnPush`** everywhere, without Zone.js: only components whose inputs or signals change are checked.
- **Debounced text filters** (350 ms) with timer cleanup in the effect.
- **Images.** `NgOptimizedImage` with a custom loader that asks Unsplash for the needed width and a centered crop at the displayed aspect ratio, `sizes`-based `srcset`, lazy loading by default, and `priority` (preload) for the hero, the product image and the first row of the listing.

## Error, loading and empty states

- Listing: a skeleton grid while a filter or page change loads, an empty state with guidance when nothing matches, and redirects for bad page numbers.
- Product: a prerendered page, a real 404 for invalid slugs, and an out-of-stock state.
- Cart and checkout: a hydration skeleton, an empty-cart state, and inline and server errors.
- Route errors: if a page's data can't be loaded, `RouteError` replaces the page (HTTP 500 when server-rendered) with a "Try again" button that re-runs the route's resolvers.

- Home: if the featured products can't be loaded, the rest of the page still renders and the "Popular now" section says so, with a link to the full listing.
- Server: API errors are always JSON (`400` for malformed or oversized JSON bodies, `500` otherwise), and unexpected errors are logged without sending stack traces or file paths to the client.

## Server (`src/server.ts`)

- **Security headers** on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a `Content-Security-Policy` limited to `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`, `Referrer-Policy`, `Cross-Origin-Opener-Policy` and `Permissions-Policy`. `X-Powered-By` is disabled. There is no `script-src` policy because Angular SSR inlines its transfer-state and event-replay scripts; HSTS belongs on the HTTPS-terminating proxy.
- **Compression** (gzip/deflate) for HTML, JSON and static files.
- **Caching.** Output-hashed bundles (`main-XXXXXXXX.js`, `chunk-…`, `styles-…`) are cached for a year as `immutable`; other static files (logos, icons, favicon) are sent with `no-cache`, so browsers revalidate them by ETag and see updates.
- **Host check.** Requests whose `Host` header isn't allowed (see `NG_ALLOWED_HOSTS`) are rejected with 400.

## Testing

The repository has no automated test suite; `npm run lint` and `npm run typecheck` are the static checks.

## Deployment

`npm run build` produces a Node server (`dist/falcon-angular-ecommerce/server/server.mjs`) plus static browser files (`dist/falcon-angular-ecommerce/browser/`, including the prerendered HTML). Run it on any Node host with `npm start`. This repository contains no host-specific deployment configuration, so it can't be confirmed from here which version the live demo URL above serves.

### Setting `SITE_URL`

`SITE_URL` is read in two places, and both must see the public origin:

| When | What uses it | If it is missing |
| --- | --- | --- |
| **Build** (`npm run build`) | Canonical links, Open Graph tags and JSON-LD written into the 523 prerendered pages (`/`, `/cart`, `/checkout`, every `/products/:slug`) | `http://localhost:3000` is baked into those HTML files |
| **Server startup** (`npm start`) | `/products` (rendered per request), unknown-slug 404 pages, `sitemap.xml`, `robots.txt` | The same `localhost` origin is served at runtime |

Rules:

- Use the exact public origin, with `https://` and without a path. A trailing slash is removed automatically.
- Use the **same** value for the build and the server. Otherwise prerendered product pages and the sitemap point at different domains.
- **Changing the domain requires a rebuild.** Restarting the server alone leaves the old origin in the prerendered pages.
- If the public host is not `localhost`, `127.0.0.1` or `falcon-angular-ecommerce.vercel.app`, also add it to `NG_ALLOWED_HOSTS` (or `security.allowedHosts` in `angular.json`), or the SSR server rejects its requests with 400.
- If `SITE_URL` is missing, the build log and the server's first log line show `WARNING: SITE_URL is not set…`. Check for it after every deploy.

To check a build, look at the canonical link in a prerendered page:

```powershell
Select-String -Path dist\falcon-angular-ecommerce\browser\index.html -Pattern 'rel="canonical" href="[^"]*"' | ForEach-Object { $_.Matches.Value }
```

#### Windows PowerShell

`$env:` variables last for the current PowerShell window only, so set them in the same window that runs both commands:

```powershell
$env:SITE_URL = "https://your-domain.example"
npm run build
npm start                          # same window, so SITE_URL is still set
```

To keep the values in a `.env` file instead (copy `.env.example`), pass the file to Node explicitly. Neither `ng` nor `npm start` reads `.env` by itself:

```powershell
Copy-Item .env.example .env        # then edit SITE_URL in .env
node --env-file=.env node_modules/@angular/cli/bin/ng.js build
node --env-file=.env dist/falcon-angular-ecommerce/server/server.mjs
```

In `cmd.exe`, use `set SITE_URL=https://your-domain.example` (no quotes, no spaces around `=`). On macOS/Linux, use `SITE_URL=https://your-domain.example npm run build`, then `SITE_URL=https://your-domain.example npm start`.

#### Hosting providers

Most hosts make dashboard environment variables available to both the build and the running service. Where a host separates build-time and runtime variables, set `SITE_URL` in both scopes. After adding or changing the variable, trigger a **new build**, not just a restart.

| Host | Build command / start command | Where to set `SITE_URL` |
| --- | --- | --- |
| Any Node host / VPS (PM2, systemd, Windows service) | `npm ci && npm run build` / `npm start` | In the shell or CI job that runs the build **and** in the service definition (systemd `Environment=`, PM2 `env`, or `--env-file`) |
| Render, Railway, or similar Node PaaS | `npm ci && npm run build` / `npm start` | Service → Environment / Variables. Set `PORT` only if the platform doesn't provide it |
| Docker | `RUN npm run build` / `CMD ["npm", "start"]` | `ARG SITE_URL` + `ENV SITE_URL=$SITE_URL` before `RUN npm run build`, built with `docker build --build-arg SITE_URL=https://…`. Set the same value again at `docker run -e SITE_URL=…` if the runtime stage doesn't keep the `ENV` |
| Vercel | Project settings | Settings → Environment Variables, scoped to **Production** (and Preview if previews should use their own origin). Values apply only to new deployments, so redeploy afterwards. Without `SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL` is used. This repo has no `vercel.json`, so how Vercel builds and serves this Express SSR server is not configured or verified here |
| GitHub Actions or other CI that builds an artifact | `npm ci && npm run build` | `env: SITE_URL: https://…` on the build step, plus the same variable on the host that runs `server.mjs` |

### Build warnings

On Node 26 and later, `npm run build` prints this about once per prerender worker:

```
(node:…) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
```

- **Source:** `@angular/build`, not this project's code. Its prerender workers register an in-memory ESM loader with `module.register()` (`node_modules/@angular/build/src/utils/server-rendering/esm-in-memory-loader/register-hooks.js`). Running `node --trace-deprecation` shows that frame.
- **Why Node 26:** Node deprecated `module.register()` in documentation in v25.9.0 and made it a runtime warning in v26.0.0. Node 22 and 24 don't print it.
- **Impact:** none. The API still works on Node 26, and the build completes and prerenders every route.
- **No upgrade fixes it yet:** the installed `@angular/build` 22.2.1 is the latest stable release, and `22.3.0-next.0` still calls `module.register()`. Update `@angular/build` / `@angular/cli` once a release moves to `module.registerHooks()`.
- **To avoid it:** build on Node 24 LTS (`^24.15.0`, in the supported range). To hide only this warning for one build in PowerShell, run `$env:NODE_OPTIONS = "--disable-warning=DEP0205"; npm run build`, then `Remove-Item Env:NODE_OPTIONS`. Don't use `--no-deprecation`, which hides every deprecation warning.

## Known limitations

- Each product has one image; the seed data has no gallery images.
- Product ratings are catalog values. Most products have no written reviews, so the page shows "Rated X out of 5 · N written reviews" and never presents an invented review count.
- Edition products are generated variants of the 48 seeds, so names and images repeat with different prices and stock.
- Stock is not reserved; the order check uses the static catalog.
- Checkout is simulated: no payments, accounts, order history or order tracking. The header's Track Order, Help Center and Sell With Us items are kept from the original design and link to the product listing; footer information pages are listed as plain text.
- Footer contact details and payment logos come from the original design and are placeholders.
