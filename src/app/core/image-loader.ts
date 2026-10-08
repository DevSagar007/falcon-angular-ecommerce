import type { ImageLoaderConfig } from "@angular/common";

/**
 * Responsive images for the catalog: Unsplash resizes and crops on the fly, so NgOptimizedImage can
 * build a srcset from it. Pass `[loaderParams]="{ ratio: height / width }"` to get a centered crop at
 * the displayed aspect ratio (what `object-cover` showed anyway, at a smaller download).
 * Local assets are served as-is.
 */
export function storeImageLoader({ src, width, loaderParams }: ImageLoaderConfig): string {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const url = new URL(src);
  if (width) url.searchParams.set("w", String(width));
  const ratio = Number(loaderParams?.["ratio"]);
  const w = Number(url.searchParams.get("w"));
  if (ratio > 0 && w > 0) {
    url.searchParams.set("h", String(Math.round(w * ratio)));
    url.searchParams.set("fit", "crop");
  }
  return url.toString();
}
