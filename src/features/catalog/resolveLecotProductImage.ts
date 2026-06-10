import { logger } from "@/core/logger";
import { lookupLocalLecotProductImage } from "@/features/catalog/lecotProductImageOverlay";
import { resolveProductImageByOrderLabel } from "@/features/catalog/lecotProductLabelImage";
import {
  getCachedLecotProductImage,
  normalizeLecotImageLookupKey,
  setCachedLecotProductImage,
} from "@/features/catalog/lecotProductImageCache";
import {
  catalogLabelForLecotSku,
  pickLecotProductImageFromHits,
  resolveLecotCatalogSku,
} from "@/features/catalog/lecotProductImageMatch";
import { lecotPlaywrightSearchEnabled } from "@/features/catalog/lecotOrderFlags";
import { parseLecotSearchHtmlProducts } from "@/features/catalog/parseLecotSearchHtmlImage";
import { lecotShopCatalogSearchUrl, lecotShopOrigin } from "@/features/catalog/lecotShopConfig";
import { fetchLecotProductHitsViaPlaywright } from "@/features/catalog/lecotPlaywrightProductImages";
import type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";

export type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";

const HTML_FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent":
    "Mozilla/5.0 (compatible; BelgmapStock/1.0; +https://belgmap.app) AppleWebKit/537.36",
};

function cacheKey(input: LecotImageLookupInput): string {
  const sku = resolveLecotCatalogSku(input);
  if (sku) return normalizeLecotImageLookupKey(sku);
  return normalizeLecotImageLookupKey(input.reference);
}

async function fetchLecotProductImageFromSearchHtml(
  catalogSku: string,
  description?: string
): Promise<string | null> {
  const label = catalogLabelForLecotSku(catalogSku) ?? description?.trim() ?? catalogSku.trim();
  const q = label.trim();
  if (q.length < 2) return null;

  const cached = getCachedLecotProductImage(`html:${normalizeLecotImageLookupKey(q)}`);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(lecotShopCatalogSearchUrl(q), {
      headers: HTML_FETCH_HEADERS,
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      setCachedLecotProductImage(`html:${normalizeLecotImageLookupKey(q)}`, null);
      return null;
    }
    const html = await res.text();
    const hits = parseLecotSearchHtmlProducts(html, lecotShopOrigin());
    const url = pickLecotProductImageFromHits(catalogSku, description, hits);
    setCachedLecotProductImage(`html:${normalizeLecotImageLookupKey(q)}`, url);
    return url;
  } catch (err) {
    logger.warn("[lecot/image] fetch HTML échoué", {
      query: q,
      error: err instanceof Error ? err.message : String(err),
    });
    setCachedLecotProductImage(`html:${normalizeLecotImageLookupKey(q)}`, null);
    return null;
  }
}

async function resolveRemoteLecotProductImage(
  input: LecotImageLookupInput
): Promise<string | null> {
  const catalogSku = resolveLecotCatalogSku(input);
  if (catalogSku) {
    const fromHtml = await fetchLecotProductImageFromSearchHtml(catalogSku, input.description);
    if (fromHtml) return fromHtml;

    if (lecotPlaywrightSearchEnabled()) {
      const searchLabel =
        catalogLabelForLecotSku(catalogSku) ?? input.description?.trim() ?? catalogSku;
      const hits = await fetchLecotProductHitsViaPlaywright(searchLabel);
      if (hits) {
        return pickLecotProductImageFromHits(catalogSku, input.description, hits);
      }
    }
  }

  const label = input.description?.trim();
  if (label) {
    return resolveProductImageByOrderLabel(label);
  }

  return null;
}

/** Résout une vignette Lecot — SKU exact uniquement, jamais une image aléatoire. */
export async function resolveLecotProductImage(
  input: LecotImageLookupInput
): Promise<string | null> {
  const direct = input.imageUrl?.trim();
  if (direct) return direct;

  const key = cacheKey(input);
  if (!key) return null;

  const cached = getCachedLecotProductImage(key);
  if (cached !== undefined) return cached;

  const local = await lookupLocalLecotProductImage(input);
  if (local) {
    setCachedLecotProductImage(key, local);
    return local;
  }

  const label = input.description?.trim();
  if (label) {
    const fromLabel = resolveProductImageByOrderLabel(label);
    if (fromLabel) {
      setCachedLecotProductImage(key, fromLabel);
      return fromLabel;
    }
  }

  const remote = await resolveRemoteLecotProductImage(input);
  setCachedLecotProductImage(key, remote);
  return remote;
}

export async function resolveLecotProductImagesBatch(
  items: LecotImageLookupInput[],
  limit = 24
): Promise<Record<string, string | null>> {
  const slice = items.slice(0, limit);
  const out: Record<string, string | null> = {};

  for (const item of slice) {
    const ref = item.reference.trim();
    if (!ref) continue;
    out[ref] = await resolveLecotProductImage(item);
  }

  return out;
}
