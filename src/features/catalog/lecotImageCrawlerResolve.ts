import { logger } from "@/core/logger";
import { searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import type { LecotProductImageEntry } from "@/features/catalog/lecotProductImageIndex";
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
import {
  fetchPageImageCached,
  fetchWithBackoff,
  HTML_FETCH_HEADERS,
  isPlaceholder,
} from "@/features/catalog/lecotImageCrawlerUtils";
import productPageUrlsJson from "../../../data/catalog/lecot/product-page-urls.json";

const PAGE_URLS = productPageUrlsJson as Record<string, string>;

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

const RESOLVERS = [
  resolveViaApi,
  resolveViaKnownPageUrl,
  resolveViaSearchLabel,
  resolveViaSearchPage,
  resolveViaPlaywright,
] as const;

/** Résout une vignette — API > fiche connue > search > fiche découverte > Playwright. */
export async function resolveLecotImageEntry(
  sku: string,
  label: string
): Promise<LecotProductImageEntry | null> {
  for (const resolve of RESOLVERS) {
    const entry = await resolve(sku, label);
    if (entry) return entry;
  }
  return null;
}
