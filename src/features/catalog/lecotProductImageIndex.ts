import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import { normalizeProductLabelKey } from "@/features/catalog/lecotProductLabelImage";
import indexJson from "../../../data/catalog/lecot/product-images-index.json";
import legacyImagesJson from "../../../data/catalog/lecot/product-images.json";
import labelImagesJson from "../../../data/catalog/lecot/product-images-by-label.json";

export type LecotProductImageSource =
  | "lecot_api"
  | "product_page"
  | "search_label"
  | "playwright"
  | "legacy";

export type LecotProductImageEntry = {
  imageUrl: string;
  label: string;
  pageUrl?: string | null;
  source: LecotProductImageSource;
  fetchedAt: string;
};

export type LecotProductImageIndex = Record<string, LecotProductImageEntry>;

const INDEX = indexJson as LecotProductImageIndex;
const LEGACY = legacyImagesJson as Record<string, string>;
const LABEL_LEGACY = labelImagesJson as Record<string, string>;

function legacyEntry(key: string, imageUrl: string, label = ""): LecotProductImageEntry {
  return {
    imageUrl,
    label,
    pageUrl: null,
    source: "legacy",
    fetchedAt: "1970-01-01T00:00:00.000Z",
  };
}

function mergedIndex(): LecotProductImageIndex {
  const out: LecotProductImageIndex = { ...INDEX };
  for (const [rawKey, imageUrl] of Object.entries(LEGACY)) {
    const key = normalizeLecotImageLookupKey(rawKey);
    if (!key) continue;
    if (out[key] && out[key].source !== "legacy") continue;
    if (!out[key]) out[key] = legacyEntry(key, imageUrl);
  }
  return out;
}

const MERGED = mergedIndex();

export function getLecotProductImageIndex(): LecotProductImageIndex {
  return MERGED;
}

export function lookupLecotProductImageIndexEntry(skuOrRef: string): LecotProductImageEntry | null {
  const key = normalizeLecotImageLookupKey(skuOrRef);
  if (!key) return null;
  return MERGED[key] ?? null;
}

export function lookupLecotProductImageIndexUrl(skuOrRef: string): string | null {
  return lookupLecotProductImageIndexEntry(skuOrRef)?.imageUrl?.trim() || null;
}

export function lookupLecotProductImageIndexByLabel(label: string): LecotProductImageEntry | null {
  const key = normalizeProductLabelKey(label);
  if (!key) return null;

  for (const entry of Object.values(MERGED)) {
    if (normalizeProductLabelKey(entry.label) === key) return entry;
  }

  const legacyUrl = LABEL_LEGACY[key];
  if (legacyUrl?.trim()) {
    return legacyEntry(key, legacyUrl.trim(), label);
  }

  return null;
}

export function lookupLecotProductImageIndexUrlByLabel(label: string): string | null {
  return lookupLecotProductImageIndexByLabel(label)?.imageUrl?.trim() || null;
}
