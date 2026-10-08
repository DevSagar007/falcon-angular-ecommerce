import { isDevMode } from "@angular/core";
import { isMainThread } from "node:worker_threads";

const configured =
  process.env["SITE_URL"] ||
  process.env["NEXT_PUBLIC_SITE_URL"] ||
  (process.env["VERCEL_PROJECT_PRODUCTION_URL"] && `https://${process.env["VERCEL_PROJECT_PRODUCTION_URL"]}`);

/**
 * Absolute site origin used for canonical URLs, sitemap and structured data (server only).
 * Set SITE_URL in production (NEXT_PUBLIC_SITE_URL is still read for existing deployments);
 * Vercel's production domain is used as a fallback.
 */
export const SITE_URL = (configured || "http://localhost:3000").replace(/\/$/, "");

const WARNED = Symbol.for("falcon.siteUrlWarning");
const flags = globalThis as typeof globalThis & { [WARNED]?: boolean };

/**
 * Production builds bake this origin into every prerendered page, so a missing value deserves a loud warning.
 * Printed at most once per process; this module is bundled into both the Express entry and the Angular
 * server bundle. Silent in development.
 */
export function warnIfSiteUrlMissing() {
  if (configured || isDevMode() || flags[WARNED]) return;
  flags[WARNED] = true;
  console.warn(
    `WARNING: SITE_URL is not set, so canonical URLs, Open Graph tags, JSON-LD and the sitemap use ${SITE_URL}. ` +
      "Set SITE_URL to the public origin when building and starting the production server.",
  );
}

// The production server runs on the main thread. During `ng build` this module is loaded again in every
// prerender worker (one per CPU core), so the build warns from route extraction instead (app.routes.server.ts).
if (isMainThread) warnIfSiteUrlMissing();
