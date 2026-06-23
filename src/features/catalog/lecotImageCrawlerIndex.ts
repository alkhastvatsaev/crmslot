import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import type { LecotProductImageIndex } from "@/features/catalog/lecotProductImageIndex";
import { normalizeProductLabelKey } from "@/features/catalog/lecotProductLabelImage";
import type { CrawlCatalogRow, CrawlResult } from "@/features/catalog/lecotImageCrawlerTypes";

export function mergeResultsIntoIndex(
  existing: LecotProductImageIndex,
  results: CrawlResult[],
  catalog: CrawlCatalogRow[]
): LecotProductImageIndex {
  const labelBySku = new Map(
    catalog.map((row) => [normalizeLecotImageLookupKey(row.sku), row.label])
  );
  const out: LecotProductImageIndex = { ...existing };

  for (const row of results) {
    if (!row.entry) continue;
    const key = normalizeLecotImageLookupKey(row.sku);
    if (!key) continue;
    out[key] = {
      ...row.entry,
      label: row.entry.label || labelBySku.get(key) || row.sku,
    };
  }

  return out;
}

export function buildLabelOverlayFromIndex(index: LecotProductImageIndex): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of Object.values(index)) {
    const labelKey = normalizeProductLabelKey(entry.label);
    if (labelKey && entry.imageUrl) out[labelKey] = entry.imageUrl;
  }
  return out;
}

export function buildLegacySkuOverlayFromIndex(
  index: LecotProductImageIndex
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [sku, entry] of Object.entries(index)) {
    if (entry.imageUrl) out[sku] = entry.imageUrl;
  }
  return out;
}
