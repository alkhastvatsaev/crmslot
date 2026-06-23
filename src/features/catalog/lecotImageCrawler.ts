import type { LecotProductImageSource } from "@/features/catalog/lecotProductImageIndex";
import { resolveLecotImageEntry } from "@/features/catalog/lecotImageCrawlerResolve";
import type {
  CrawlCatalogRow,
  CrawlReport,
  CrawlResult,
} from "@/features/catalog/lecotImageCrawlerTypes";

export type {
  CrawlCatalogRow,
  CrawlReport,
  CrawlResult,
} from "@/features/catalog/lecotImageCrawlerTypes";
export { clearLecotPageImageCache, mapPool } from "@/features/catalog/lecotImageCrawlerUtils";
export {
  buildLabelOverlayFromIndex,
  buildLegacySkuOverlayFromIndex,
  mergeResultsIntoIndex,
} from "@/features/catalog/lecotImageCrawlerIndex";

/** Résout une vignette pour un SKU catalogue — API > fiche connue > search > fiche découverte > Playwright. */
export async function crawlLecotProductImage(row: CrawlCatalogRow): Promise<CrawlResult> {
  const sku = row.sku.trim();
  const label = row.label.trim();
  if (!sku || !label) return { sku, entry: null, error: "missing sku or label" };

  try {
    const entry = await resolveLecotImageEntry(sku, label);
    if (entry) return { sku, entry };
    return { sku, entry: null, error: "no match" };
  } catch (err) {
    return {
      sku,
      entry: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function buildCrawlReport(results: CrawlResult[]): CrawlReport {
  const bySource: Record<LecotProductImageSource, number> = {
    lecot_api: 0,
    product_page: 0,
    search_label: 0,
    playwright: 0,
    legacy: 0,
  };
  const misses: CrawlReport["misses"] = [];

  for (const row of results) {
    if (row.entry) {
      bySource[row.entry.source] += 1;
    } else {
      misses.push({ sku: row.sku, label: "", error: row.error });
    }
  }

  const ok = results.filter((row) => row.entry).length;
  return {
    generatedAt: new Date().toISOString(),
    total: results.length,
    ok,
    miss: results.length - ok,
    placeholder: 0,
    bySource,
    misses,
  };
}
