import { logger } from "@/core/logger";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { lecotPlaywrightSearchEnabled } from "@/features/catalog/lecotOrderFlags";
import { searchLecotViaPlaywright } from "@/features/catalog/lecotPlaywrightScraper";

type LecotApiHit = {
  sku?: string;
  reference?: string;
  label?: string;
  name?: string;
  unitPriceCents?: number;
  price?: number;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  thumbnail?: string;
};

function pickImageUrl(raw: LecotApiHit): string | null {
  for (const candidate of [raw.imageUrl, raw.image_url, raw.image, raw.thumbnail]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

function mapHit(raw: LecotApiHit): CatalogProduct | null {
  const sku = String(raw.sku ?? raw.reference ?? "").trim();
  const label = String(raw.label ?? raw.name ?? "").trim();
  if (!sku || !label) return null;
  let unitPriceCents = typeof raw.unitPriceCents === "number" ? raw.unitPriceCents : 0;
  if (!unitPriceCents && typeof raw.price === "number") {
    unitPriceCents = Math.round(raw.price * 100);
  }
  const imageUrl = pickImageUrl(raw);
  return {
    sku,
    label,
    unitPriceCents,
    ...(imageUrl ? { imageUrl } : {}),
  };
}

export function lecotApiBaseUrl(): string | null {
  return process.env.LECOT_API_URL?.trim() || process.env.LECOT_API_BASE_URL?.trim() || null;
}

export function lecotApiSearchPath(): string {
  const path = process.env.LECOT_API_SEARCH_PATH?.trim();
  if (path && path.startsWith("/")) return path;
  return "/products/search";
}

/**
 * Appelle l'API Lecot si configurée, sinon Playwright (opt-in), sinon null → catalogue local JSON.
 */
export async function searchLecotViaApi(query: string): Promise<CatalogProduct[] | null> {
  const base = lecotApiBaseUrl();
  if (!base) {
    if (lecotPlaywrightSearchEnabled()) {
      try {
        return await searchLecotViaPlaywright(query);
      } catch (err) {
        logger.warn("[lecot/search] Playwright échoué, fallback catalogue local.", {
          error: err instanceof Error ? err.message : String(err),
        });
        return null;
      }
    }
    return null;
  }

  const url = new URL(lecotApiSearchPath(), base.endsWith("/") ? base : `${base}/`);
  url.searchParams.set("q", query);

  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.LECOT_API_KEY?.trim() || process.env.LECOT_API_TOKEN?.trim();
  if (key) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as
    | { products?: LecotApiHit[]; items?: LecotApiHit[] }
    | LecotApiHit[]
    | null;

  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return rows.map(mapHit).filter((p): p is CatalogProduct => p !== null);
}
