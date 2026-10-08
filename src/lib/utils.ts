import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function taka(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}

export function productPath(product: { slug: string }) {
  return `/products/${product.slug}`;
}
