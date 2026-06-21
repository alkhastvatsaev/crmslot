import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
import { LOCKSMITH_STOCK_SEED_CATALOG } from "@/features/catalog/locksmithStockSeedCatalog";
import type { StockImageMap } from "@/features/featureHub/hooks/useCompanyStockImages";
import type { CatalogMatchedPart } from "@/features/materials/matchStockCatalogItem";
import type { StockItem } from "@/features/materials/stockFirestore";

/** Index id → article catalogue (live + seed preview). */
export function buildStockCatalogById(stockItems: StockItem[]): Map<string, StockItem> {
  const map = new Map<string, StockItem>();
  for (const item of stockItems) map.set(item.id, item);
  for (const row of LOCKSMITH_STOCK_SEED_CATALOG) {
    if (!map.has(row.id)) {
      map.set(row.id, { ...row, companyId: stockItems[0]?.companyId ?? "" });
    }
  }
  return map;
}

/** Articles à charger via useCompanyStockImages pour les suggestions visibles. */
export function stockItemsForSuggestionImages(
  suggestions: CatalogMatchedPart[],
  catalogById: Map<string, StockItem>
): StockItem[] {
  const out: StockItem[] = [];
  const seen = new Set<string>();
  for (const part of suggestions) {
    const id = part.stockItemId?.trim();
    if (!id || seen.has(id)) continue;
    const item = catalogById.get(id);
    if (!item) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

export function resolveMaterialSuggestionImageUrl(
  part: CatalogMatchedPart,
  catalogById: Map<string, StockItem>,
  imageUrls: StockImageMap
): string | null {
  const stockItem = part.stockItemId ? catalogById.get(part.stockItemId) : null;

  if (part.imageUrl?.trim()) return part.imageUrl.trim();
  if (part.stockItemId && imageUrls[part.stockItemId]?.trim()) {
    return imageUrls[part.stockItemId]!.trim();
  }
  if (stockItem?.imageUrl?.trim()) return stockItem.imageUrl.trim();

  return lookupClientLecotProductImageOverlay({
    reference:
      part.catalogReference?.trim() || part.reference?.trim() || stockItem?.reference || "",
    lecotSku: part.lecotSku ?? stockItem?.lecotSku,
    description: part.catalogDescription?.trim() || stockItem?.description || part.description,
  });
}
