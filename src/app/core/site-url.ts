import { DOCUMENT, InjectionToken, TransferState, inject, makeStateKey } from "@angular/core";

export const SITE_NAME = "Falcon";

export const SITE_URL_STATE_KEY = makeStateKey<string>("siteUrl");

/**
 * Absolute site origin for canonical URLs and structured data. The server config provides it from
 * the SITE_URL environment variable and transfers it to the browser; the page origin is a fallback.
 */
export const SITE_URL = new InjectionToken<string>("SITE_URL", {
  providedIn: "root",
  factory: () => inject(TransferState).get(SITE_URL_STATE_KEY, null) ?? inject(DOCUMENT).location.origin,
});
