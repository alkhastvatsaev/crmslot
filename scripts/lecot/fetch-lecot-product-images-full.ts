/* eslint-disable no-console */
/**
 * Crawl parallèle ~540 SKU → product-images-index.json (+ overlays dérivés).
 *
 * Usage :
 *   npm run fetch:lecot-images:full
 *   LECOT_IMAGE_CONCURRENCY=25 npm run fetch:lecot-images:full
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { normalizeLecotImageLookupKey } from "../../src/features/catalog/lecotProductImageCache";
import {
  buildCrawlReport,
  buildLabelOverlayFromIndex,
  buildLegacySkuOverlayFromIndex,
  crawlLecotProductImage,
  mapPool,
  mergeResultsIntoIndex,
  type CrawlCatalogRow,
  type CrawlResult,
} from "../../src/features/catalog/lecotImageCrawler";
import type { LecotProductImageIndex } from "../../src/features/catalog/lecotProductImageIndex";
import { normalizeProductLabelKey } from "../../src/features/catalog/lecotProductLabelImage";

const DATA_DIR = path.join(process.cwd(), "data/catalog/lecot");
const PRODUCTS_PATH = path.join(DATA_DIR, "products.json");
const INDEX_PATH = path.join(DATA_DIR, "product-images-index.json");
const LEGACY_IMAGES_PATH = path.join(DATA_DIR, "product-images.json");
const LABELS_PATH = path.join(DATA_DIR, "product-images-by-label.json");
const REPORT_PATH = path.join(DATA_DIR, "crawl-report.json");
const CHECKPOINT_PATH = path.join(DATA_DIR, ".crawl-progress.json");

const CONCURRENCY = Math.max(1, Number(process.env.LECOT_IMAGE_CONCURRENCY ?? 25));

type Checkpoint = {
  completedSkus: string[];
  results: CrawlResult[];
};

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeSortedJson(filePath: string, data: Record<string, unknown>) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

function saveCheckpoint(checkpoint: Checkpoint) {
  fs.writeFileSync(CHECKPOINT_PATH, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
}

async function main() {
  const catalog = readJson<CrawlCatalogRow[]>(PRODUCTS_PATH, []);
  if (!catalog.length) {
    console.error("products.json empty or missing");
    process.exit(1);
  }

  const existingIndex = readJson<LecotProductImageIndex>(INDEX_PATH, {});
  const checkpoint = readJson<Checkpoint>(CHECKPOINT_PATH, { completedSkus: [], results: [] });
  const completed = new Set(
    checkpoint.completedSkus.map((sku) => normalizeLecotImageLookupKey(sku))
  );

  const pending = catalog.filter((row) => !completed.has(normalizeLecotImageLookupKey(row.sku)));
  console.log(
    `Catalog ${catalog.length} SKU — ${completed.size} done, ${pending.length} pending @ concurrency ${CONCURRENCY}`
  );

  const allResults: CrawlResult[] = [...checkpoint.results];

  if (pending.length > 0) {
    const batchResults = await mapPool(pending, CONCURRENCY, async (row) => {
      const result = await crawlLecotProductImage(row);
      const key = normalizeLecotImageLookupKey(row.sku);
      completed.add(key);
      allResults.push(result);
      saveCheckpoint({ completedSkus: [...completed], results: allResults });
      const status = result.entry ? `✓ ${result.entry.source}` : `✗ ${result.error ?? "miss"}`;
      console.log(`${status} — ${row.sku}`);
      return result;
    });
    void batchResults;
  }

  const mergedIndex = mergeResultsIntoIndex(existingIndex, allResults, catalog);
  writeSortedJson(INDEX_PATH, mergedIndex as Record<string, unknown>);

  const legacyOverlay = buildLegacySkuOverlayFromIndex(mergedIndex);
  const stockRefs = readJson<Record<string, string>>(LEGACY_IMAGES_PATH, {});
  for (const [key, url] of Object.entries(stockRefs)) {
    if (!legacyOverlay[key] && url) legacyOverlay[key] = url;
  }
  writeSortedJson(LEGACY_IMAGES_PATH, legacyOverlay);

  const labelOverlay = buildLabelOverlayFromIndex(mergedIndex);
  const trackingLabels = readJson<Record<string, string>>(LABELS_PATH, {});
  for (const [key, url] of Object.entries(trackingLabels)) {
    if (!labelOverlay[key] && url) labelOverlay[key] = url;
  }
  for (const row of catalog) {
    const key = normalizeProductLabelKey(row.label);
    const skuKey = normalizeLecotImageLookupKey(row.sku);
    const entry = mergedIndex[skuKey];
    if (key && entry?.imageUrl && !labelOverlay[key]) {
      labelOverlay[key] = entry.imageUrl;
    }
  }
  writeSortedJson(LABELS_PATH, labelOverlay);

  const report = buildCrawlReport(allResults);
  const catalogBySku = new Map(
    catalog.map((row) => [normalizeLecotImageLookupKey(row.sku), row.label])
  );
  report.misses = report.misses.map((miss) => ({
    ...miss,
    label: catalogBySku.get(normalizeLecotImageLookupKey(miss.sku)) ?? miss.label,
  }));

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `\nIndex ${Object.keys(mergedIndex).length} entries → ${INDEX_PATH}\nReport: ok=${report.ok} miss=${report.miss} → ${REPORT_PATH}`
  );

  if (fs.existsSync(CHECKPOINT_PATH) && pending.length === 0) {
    fs.unlinkSync(CHECKPOINT_PATH);
    console.log("Checkpoint cleared.");
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
