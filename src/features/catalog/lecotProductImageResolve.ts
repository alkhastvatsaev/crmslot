import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import {
  lookupLecotProductImageIndexEntry,
  lookupLecotProductImageIndexUrl,
} from "@/features/catalog/lecotProductImageIndex";

/** Correspondance stricte dans product-images-index — pas d'alias ni de famille. */
export function resolveOverlayImageKey(rawKey: string): string | null {
  const key = normalizeLecotImageLookupKey(rawKey);
  if (!key) return null;
  const entry = lookupLecotProductImageIndexEntry(rawKey);
  if (!entry?.imageUrl?.trim()) return null;
  return key;
}

export function lookupOverlayImageUrl(rawKey: string): string | null {
  return lookupLecotProductImageIndexUrl(rawKey);
}

export function hasExactOverlayImage(reference: string, lecotSku?: string | null): boolean {
  if (resolveOverlayImageKey(reference)) return true;
  const sku = lecotSku?.trim();
  return Boolean(sku && resolveOverlayImageKey(sku));
}
