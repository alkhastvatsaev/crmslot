import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import productPageUrlsJson from "../../../data/catalog/lecot/product-page-urls.json";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import { resolveLecotCatalogSku } from "@/features/catalog/lecotProductImageMatch";
import { lookupOverlayImageUrl } from "@/features/catalog/lecotProductImageResolve";
import type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";
import { fetchLecotProductPageImage } from "@/features/catalog/lecotProductPageImage";

type PageUrlOverlay = Record<string, string>;

const PAGE_URLS: PageUrlOverlay = productPageUrlsJson as PageUrlOverlay;

const catalogBySku = new Map<string, CatalogProduct>();
for (const row of LECOT_CATALOG) {
  catalogBySku.set(normalizeLecotImageLookupKey(row.sku), row);
}

function overlayUrlForKey(key: string): string | null {
  return lookupOverlayImageUrl(key);
}

function catalogImageForSku(sku: string): string | null {
  const row = catalogBySku.get(normalizeLecotImageLookupKey(sku));
  return row?.imageUrl?.trim() ? row.imageUrl.trim() : null;
}

/** Catalogue local / overlay JSON — sans appel réseau (sauf fallback fiche produit). */
export async function lookupLocalLecotProductImage(
  input: LecotImageLookupInput
): Promise<string | null> {
  const catalogSku = resolveLecotCatalogSku(input);
  if (catalogSku) {
    const fromOverlay = overlayUrlForKey(catalogSku);
    if (fromOverlay) return fromOverlay;

    const fromCatalog = catalogImageForSku(catalogSku);
    if (fromCatalog) return fromCatalog;

    const pageUrl = PAGE_URLS[normalizeLecotImageLookupKey(catalogSku)];
    if (pageUrl) {
      const fromPage = await fetchLecotProductPageImage(pageUrl);
      if (fromPage) return fromPage;
    }
  }

  const refOverlay = overlayUrlForKey(input.reference);
  if (refOverlay) return refOverlay;

  return null;
}
