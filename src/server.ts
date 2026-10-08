import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from "@angular/ssr/node";
import compression from "compression";
import express, { type ErrorRequestHandler } from "express";
import { join } from "node:path";
import { handleApiRequest } from "./server/api";
import { getAllProductSlugs } from "./server/product.service";
import { SITE_URL } from "./server/site";

const browserDistFolder = join(import.meta.dirname, "../browser");

/** True when started directly (`npm start`, `node server.mjs`, PM2) rather than loaded by the Angular CLI. */
const isEntryPoint = isMainModule(import.meta.url) || Boolean(process.env["pm_id"]);

// The standalone server is the production server. Defaulting here (an explicit NODE_ENV still wins) keeps
// `npm start` cross-platform; Express reads it when the app is created, e.g. to hide stack traces.
if (isEntryPoint) process.env["NODE_ENV"] ??= "production";

/** Output-hashed bundles (e.g. `main-I7R6AYNM.js`) never change, so they can be cached for a year. */
const HASHED_FILE = /-[A-Za-z0-9_-]{8}\.(?:js|mjs|css)$/;

const app = express();
const angularApp = new AngularNodeAppEngine();

app.disable("x-powered-by");

/** Basic security headers. No script-src CSP: Angular SSR inlines its transfer-state and event-replay scripts. */
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(compression());

/** Mock REST API: /api/products, /api/products/:idOrSlug, /api/products/:idOrSlug/related, POST /api/orders. */
app.use("/api", express.json({ limit: "100kb" }), (req, res, next) => {
  const url = new URL(req.originalUrl, "http://localhost");
  handleApiRequest(req.method, url.pathname, url.searchParams, req.body)
    .then((response) => {
      if (!response) return res.status(404).json({ error: "Not found" });
      return res.status(response.status).json(response.body);
    })
    .catch(next);
});

/** API errors are always JSON; malformed or oversized bodies are client errors, anything else is logged. */
const apiErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number(error?.status ?? error?.statusCode) || 500;
  if (status >= 500) console.error(error);
  const message =
    error?.type === "entity.parse.failed"
      ? "Request body is not valid JSON"
      : error?.type === "entity.too.large"
        ? "Request body is too large"
        : status >= 500
          ? "Internal server error"
          : "Bad request";
  res.status(status).json({ error: message });
};
app.use("/api", apiErrorHandler);

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    ["User-Agent: *", "Allow: /", "Disallow: /cart", "Disallow: /checkout", "Disallow: /api/", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n"),
  );
});

app.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const entries = [
      { loc: SITE_URL, changefreq: "weekly", priority: 1 },
      { loc: `${SITE_URL}/products`, changefreq: "daily", priority: 0.9 },
      ...(await getAllProductSlugs()).map((slug) => ({
        loc: `${SITE_URL}/products/${slug}`,
        changefreq: "weekly",
        priority: 0.7,
      })),
    ];
    const urls = entries
      .map((e) => `<url>\n<loc>${e.loc}</loc>\n<changefreq>${e.changefreq}</changefreq>\n<priority>${e.priority}</priority>\n</url>`)
      .join("\n");
    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  } catch (error) {
    next(error);
  }
});

/**
 * Serve static files from /browser. Only output-hashed bundles are cached long-term; everything else
 * (logos, icons, favicon) is revalidated with its ETag so updates reach returning visitors.
 */
app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    cacheControl: false,
    setHeaders: (res, path) => {
      res.setHeader("Cache-Control", HASHED_FILE.test(path) ? "public, max-age=31536000, immutable" : "no-cache");
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/** Last resort: log the error and answer without exposing stack traces or file paths. */
const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).type("text/plain").send("Internal Server Error");
};
app.use(errorHandler);

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 3000.
 */
if (isEntryPoint) {
  const port = process.env["PORT"] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
