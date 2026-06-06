import { matchStockCatalogImageLookup } from "@/features/catalog/matchStockCatalogImageLookup";
import { lookupOverlayImageUrl } from "@/features/catalog/lecotProductImageResolve";
import { resolveProductImageByOrderLabel } from "@/features/catalog/lecotProductLabelImage";

/** Vignette locale (JSON commité) — correspondance stricte réf / SKU Lecot, puis libellé article. */
export function lookupClientLecotProductImageOverlay(input: {
  reference: string;
  lecotSku?: string | null;
  description?: string | null;
}): string | null {
  const safeLecotSku =
    input.lecotSku?.trim() && /^lec-/i.test(input.lecotSku.trim()) ? input.lecotSku.trim() : null;
  if (safeLecotSku) {
    const fromSku = lookupOverlayImageUrl(safeLecotSku);
    if (fromSku) return fromSku;
  }

  const ref = input.reference.trim();
  if (ref) {
    const fromRef = lookupOverlayImageUrl(ref);
    if (fromRef) return fromRef;
  }

  const label = input.description?.trim();
  if (label) {
    const fromLabel = resolveProductImageByOrderLabel(label);
    if (fromLabel) return fromLabel;
  }

  const matched = matchStockCatalogImageLookup({
    reference: input.reference,
    sku: input.lecotSku,
    description: input.description,
    label: input.description,
  });
  if (matched) {
    if (matched.lecotSku) {
      const fromMatchedSku = lookupOverlayImageUrl(matched.lecotSku);
      if (fromMatchedSku) return fromMatchedSku;
    }
    const fromMatchedRef = lookupOverlayImageUrl(matched.reference);
    if (fromMatchedRef) return fromMatchedRef;
    if (matched.description) {
      const fromMatchedLabel = resolveProductImageByOrderLabel(matched.description);
      if (fromMatchedLabel) return fromMatchedLabel;
    }
  }

  return null;
}
