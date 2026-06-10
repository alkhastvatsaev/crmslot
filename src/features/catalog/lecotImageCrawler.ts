import { logger } from "@/core/logger";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import type {
  LecotProductImageEntry,
  LecotProductImageIndex,
  LecotProductImageSource,
} from "@/features/catalog/lecotProductImageIndex";
import { normalizeProductLabelKey } from "@/features/catalog/lecotProductLabelImage";
import {
  pickBestLecotProductImageByLabel,
  pickLecotProductImageHit,
  type LecotSearchProductHit,
} from "@/features/catalog/lecotProductImageMatch";
import { fetchLecotProductPageImage } from "@/features/catalog/lecotProductPageImage";
import { parseLecotSearchHtmlProducts } from "@/features/catalog/parseLecotSearchHtmlImage";
import { lecotPlaywrightSearchEnabled } from "@/features/catalog/lecotOrderFlags";
import { fetchLecotProductHitsViaPlaywright } from "@/features/catalog/lecotPlaywrightProductImages";
import { lecotShopCatalogSearchUrl, lecotShopOrigin } from "@/features/catalog/lecotShopConfig";
import productPageUrlsJson from "../../../data/catalog/lecot/product-page-urls.json";

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

const PAGE_URLS = productPageUrlsJson as Record<string, string>;

const pageImageCache = new Map<string, string | null>();

async function fetchPageImageCached(pageUrl: string): Promise<string | null> {
  if (pageImageCache.has(pageUrl)) return pageImageCache.get(pageUrl) ?? null;
  const imageUrl = await fetchLecotProductPageImage(pageUrl);
  pageImageCache.set(pageUrl, imageUrl);
  return imageUrl;
}

export function clearLecotPageImageCache(): void {
  pageImageCache.clear();
}

const HTML_FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent": "Mozilla/5.0 (compatible; BelgmapImageCrawler/1.0) AppleWebKit/537.36",
};

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]!, index);
    }
  }

  const workers = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

function isPlaceholder(url: string): boolean {
  return /\/placeholder\/default\//i.test(url);
}

const RETRYABLE_STATUS = new Set([429, 503]);

async function fetchWithBackoff(url: string, init: RequestInit, attempts = 4): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await fetch(url, init);
    if (!RETRYABLE_STATUS.has(last.status)) return last;
    const delayMs = Math.min(8000, 400 * 2 ** i);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return last!;
}

async function fetchSearchHits(query: string): Promise<LecotSearchProductHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetchWithBackoff(lecotShopCatalogSearchUrl(q), {
      headers: HTML_FETCH_HEADERS,
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseLecotSearchHtmlProducts(html, lecotShopOrigin());
  } catch (err) {
    logger.warn("[lecot/crawler] search HTML failed", {
      query: q,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

async function resolveViaApi(sku: string, label: string): Promise<LecotProductImageEntry | null> {
  const hits = await searchLecotViaApi(`${sku} ${label}`.trim());
  if (!hits?.length) return null;

  const skuNorm = normalizeLecotImageLookupKey(sku);
  const exact = hits.find((hit) => normalizeLecotImageLookupKey(hit.sku) === skuNorm);
  const row = exact ?? hits.find((hit) => hit.imageUrl);
  const imageUrl = row?.imageUrl?.trim();
  if (!imageUrl || isPlaceholder(imageUrl)) return null;

  return {
    imageUrl,
    label,
    pageUrl: null,
    source: "lecot_api",
    fetchedAt: new Date().toISOString(),
  };
}

async function resolveViaKnownPageUrl(
  sku: string,
  label: string
): Promise<LecotProductImageEntry | null> {
  const pageUrl = PAGE_URLS[normalizeLecotImageLookupKey(sku)];
  if (!pageUrl) return null;

  const imageUrl = await fetchPageImageCached(pageUrl);
  if (!imageUrl || isPlaceholder(imageUrl)) return null;

  return {
    imageUrl,
    label,
    pageUrl,
    source: "product_page",
    fetchedAt: new Date().toISOString(),
  };
}

async function resolveViaSearchLabel(
  sku: string,
  label: string
): Promise<LecotProductImageEntry | null> {
  const queries = [`${sku} ${label}`.trim(), label.trim()].filter((q) => q.length >= 4);

  for (const query of queries) {
    const hits = await fetchSearchHits(query);
    if (!hits.length) continue;

    const bySku = pickLecotProductImageHit(sku, label, hits);
    const imageUrl = bySku ?? pickBestLecotProductImageByLabel(label, hits);
    if (!imageUrl || isPlaceholder(imageUrl)) continue;

    const hit = hits.find((row) => row.imageUrl === imageUrl);
    return {
      imageUrl,
      label,
      pageUrl: hit?.pageUrl ?? null,
      source: "search_label",
      fetchedAt: new Date().toISOString(),
    };
  }

  return null;
}

async function resolveViaSearchPage(
  sku: string,
  label: string
): Promise<LecotProductImageEntry | null> {
  const hits = await fetchSearchHits(`${sku} ${label}`.trim());
  const hitWithPage = hits.find((hit) => hit.pageUrl);
  if (!hitWithPage?.pageUrl) return null;

  const imageUrl = await fetchLecotProductPageImage(hitWithPage.pageUrl);
  if (!imageUrl || isPlaceholder(imageUrl)) return null;

  return {
    imageUrl,
    label,
    pageUrl: hitWithPage.pageUrl,
    source: "product_page",
    fetchedAt: new Date().toISOString(),
  };
}

async function resolveViaPlaywright(
  sku: string,
  label: string
): Promise<LecotProductImageEntry | null> {
  if (!lecotPlaywrightSearchEnabled()) return null;

  const hits = await fetchLecotProductHitsViaPlaywright(`${sku} ${label}`.trim());
  if (!hits?.length) return null;

  const bySku = pickLecotProductImageHit(sku, label, hits);
  const imageUrl = bySku ?? pickBestLecotProductImageByLabel(label, hits);
  if (!imageUrl || isPlaceholder(imageUrl)) return null;

  const hit = hits.find((row) => row.imageUrl === imageUrl);
  return {
    imageUrl,
    label,
    pageUrl: hit?.pageUrl ?? null,
    source: "playwright",
    fetchedAt: new Date().toISOString(),
  };
}

/** Résout une vignette pour un SKU catalogue — API > fiche connue > search > fiche découverte > Playwright. */
export async function crawlLecotProductImage(row: CrawlCatalogRow): Promise<CrawlResult> {
  const sku = row.sku.trim();
  const label = row.label.trim();
  if (!sku || !label) return { sku, entry: null, error: "missing sku or label" };

  try {
    const resolvers = [
      resolveViaApi,
      resolveViaKnownPageUrl,
      resolveViaSearchLabel,
      resolveViaSearchPage,
      resolveViaPlaywright,
    ];
    for (const resolve of resolvers) {
      const entry = await resolve(sku, label);
      if (entry) return { sku, entry };
    }
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
