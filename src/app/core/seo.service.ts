import { DOCUMENT, Injectable, inject } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { SITE_NAME, SITE_URL } from "./site-url";

const DEFAULT_TITLE = "Falcon — Everyday things, better chosen";
const DEFAULT_DESCRIPTION =
  "Falcon is a modern storefront for useful, beautiful products. Browse 500+ items across electronics, audio, lifestyle and accessories.";
const DEFAULT_OG = {
  title: DEFAULT_TITLE,
  description: "Browse 500+ products across electronics, audio, lifestyle and accessories.",
  siteName: SITE_NAME,
};

export type PageMeta = {
  /** Page title; rendered as "<title> | Falcon". Omit for the default site title. */
  title?: string;
  description?: string;
  /** Site-relative canonical path, e.g. "/products". */
  canonical?: string;
  robots?: { index: boolean; follow?: boolean };
  /** Replaces the site-wide Open Graph tags, as page-level metadata did before. */
  openGraph?: { title: string; description: string; url: string; image: { url: string; alt: string } };
  /** Structured data rendered as an application/ld+json script. */
  jsonLd?: object;
};

/**
 * Sets the document title, meta tags, canonical link and JSON-LD for the current page.
 * Every call starts from the site defaults, so tags from the previous page never leak.
 */
@Injectable({ providedIn: "root" })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly siteUrl = inject(SITE_URL);

  set(page: PageMeta) {
    this.title.setTitle(page.title ? `${page.title} | ${SITE_NAME}` : DEFAULT_TITLE);
    this.meta.updateTag({ name: "description", content: page.description ?? DEFAULT_DESCRIPTION });
    this.meta.updateTag({ name: "application-name", content: SITE_NAME });

    if (page.robots) {
      const { index, follow } = page.robots;
      const robots = [index ? "index" : "noindex", ...(follow === undefined ? [] : [follow ? "follow" : "nofollow"])];
      this.meta.updateTag({ name: "robots", content: robots.join(", ") });
    } else {
      this.meta.removeTag('name="robots"');
    }

    const og = page.openGraph;
    this.meta.updateTag({ property: "og:title", content: og?.title ?? DEFAULT_OG.title });
    this.meta.updateTag({ property: "og:description", content: og?.description ?? DEFAULT_OG.description });
    this.meta.updateTag({ property: "og:type", content: "website" });
    if (og) {
      this.meta.removeTag('property="og:site_name"');
      this.meta.updateTag({ property: "og:url", content: this.absolute(og.url) });
      this.meta.updateTag({ property: "og:image", content: og.image.url });
      this.meta.updateTag({ property: "og:image:alt", content: og.image.alt });
    } else {
      this.meta.updateTag({ property: "og:site_name", content: DEFAULT_OG.siteName });
      for (const property of ["og:url", "og:image", "og:image:alt"]) this.meta.removeTag(`property="${property}"`);
    }

    this.setCanonical(page.canonical);
    this.setJsonLd(page.jsonLd);
  }

  absolute(path: string) {
    return `${this.siteUrl}${path}`;
  }

  private setCanonical(path: string | undefined) {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!path) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement("link");
      link.setAttribute("rel", "canonical");
      this.document.head.appendChild(link);
    }
    link.setAttribute("href", this.absolute(path));
  }

  private setJsonLd(data: object | undefined) {
    let script = this.document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      this.document.head.appendChild(script);
    }
    // Escaped so catalog text can never close the script element.
    script.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
  }
}
