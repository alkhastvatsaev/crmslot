import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { searchCatalogProductsScored } from "@/features/catalog/searchCatalogProducts";
import { STUB_CATALOG, type CatalogProduct } from "@/features/catalog/productQuickAdd";
import { mergeCatalogProducts } from "@/features/catalog/searchCatalogProducts";
import type { MissionKitItem } from "@/features/missionKit/types";

const DEFAULT_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

export function resolveMissionKitCatalog(catalog?: CatalogProduct[]): CatalogProduct[] {
  if (catalog && catalog.length > 0) return catalog;
  return DEFAULT_CATALOG;
}

export function matchMissionKitItemToCatalog(
  item: MissionKitItem,
  catalog: CatalogProduct[]
): CatalogProduct | null {
  const query = [item.reference, item.lecotSku, item.label].filter(Boolean).join(" ").trim();
  if (!query) return null;
  const hits = searchCatalogProductsScored(catalog, query, 1);
  return hits[0] ?? null;
}

export function matchMissionKitToLecot(
  items: MissionKitItem[],
  catalog?: CatalogProduct[]
): MissionKitItem[] {
  const resolved = resolveMissionKitCatalog(catalog);

  return items.map((item) => {
    const product = matchMissionKitItemToCatalog(item, resolved);
    if (!product) return item;

    return {
      ...item,
      label: item.label || product.label,
      reference: item.reference ?? product.sku,
      lecotSku: product.sku,
      source: item.source === "historical_billing" ? item.source : "lecot_catalog",
      confidence: Math.min(0.98, Math.max(item.confidence, 0.72)),
    };
  });
}
