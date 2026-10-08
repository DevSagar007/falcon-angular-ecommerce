export type Review = { id: string; author: string; rating: number; comment: string };

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  category: string;
  rating: number;
  stock: number;
  image: string;
  description: string;
  reviews: Review[];
};

export type SortOption = "featured" | "price-low" | "price-high" | "rating";

export type ProductQuery = {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
};

export type ProductListResult = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
  /** The normalized query that was actually applied. */
  query: Required<Pick<ProductQuery, "sort" | "page" | "limit">> & Omit<ProductQuery, "sort" | "page" | "limit">;
};
