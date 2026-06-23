import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import type {
  LecotProductImageEntry,
  LecotProductImageSource,
} from "@/features/catalog/lecotProductImageIndex";

export type CrawlCatalogRow = Pick<CatalogProduct, "sku" | "label">;

export type CrawlResult = {
  sku: string;
  entry: LecotProductImageEntry | null;
  error?: string;
};

export type CrawlReport = {
  generatedAt: string;
  total: number;
  ok: number;
  miss: number;
  placeholder: number;
  bySource: Record<LecotProductImageSource, number>;
  misses: Array<{ sku: string; label: string; error?: string }>;
};
