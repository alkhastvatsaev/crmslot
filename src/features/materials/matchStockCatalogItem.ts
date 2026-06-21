import { matchStockCatalogImageLookup } from "@/features/catalog/matchStockCatalogImageLookup";
import { labelOverlapScore } from "@/features/catalog/lecotProductImageMatch";
import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import { LOCKSMITH_STOCK_SEED_CATALOG } from "@/features/catalog/locksmithStockSeedCatalog";
import type { MaterialOrderPart } from "@/features/materials/types";
import type { StockItem } from "@/features/materials/stockFirestore";

export type CatalogMatchedPart = MaterialOrderPart & {
  stockItemId?: string | null;
  imageUrl?: string | null;
  lecotSku?: string | null;
  catalogReference?: string | null;
  /** Libellé article catalogue (tuile Matériel). */
  catalogDescription?: string | null;
};

function refKey(value: string): string {
  return normalizeLecotImageLookupKey(value);
}

function findStockItem(
  stockItems: StockItem[],
  reference: string,
  lecotSku?: string | null
): StockItem | null {
  const key = refKey(reference);
  const skuKey = lecotSku?.trim() ? refKey(lecotSku) : "";

  const fromLive = stockItems.find((item) => {
    if (key && refKey(item.reference) === key) return true;
    if (skuKey && item.lecotSku && refKey(item.lecotSku) === skuKey) return true;
    return false;
  });
  if (fromLive) return fromLive;

  const seed = LOCKSMITH_STOCK_SEED_CATALOG.find((row) => {
    if (key && refKey(row.reference) === key) return true;
    if (skuKey && row.lecotSku && refKey(row.lecotSku) === skuKey) return true;
    return false;
  });
  if (!seed) return null;

  return { ...seed, companyId: stockItems[0]?.companyId ?? "" };
}

function findStockItemByDescription(
  part: MaterialOrderPart,
  stockItems: StockItem[]
): StockItem | null {
  const query = part.description.trim();
  if (query.length < 8) return null;

  const pool =
    stockItems.length > 0
      ? stockItems
      : LOCKSMITH_STOCK_SEED_CATALOG.map((row) => ({
          ...row,
          companyId: "",
        }));

  const ranked = pool
    .map((row) => ({ row, score: labelOverlapScore(query, row.description) }))
    .filter(({ score }) => score >= 6)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best) return null;
  return best.row;
}

/** Associe une pièce suggérée à un article du catalogue stock (vignette + id tuile). */
export function matchStockCatalogItem(
  part: MaterialOrderPart,
  stockItems: StockItem[] = []
): CatalogMatchedPart {
  const lookup = matchStockCatalogImageLookup({
    reference: part.reference,
    description: part.description,
    label: part.description,
  });

  const catalogReference = lookup?.reference?.trim() || part.reference?.trim() || "";
  const lecotSku = lookup?.lecotSku?.trim() || null;
  let stockItem =
    catalogReference || lecotSku ? findStockItem(stockItems, catalogReference, lecotSku) : null;
  if (!stockItem) {
    stockItem = findStockItemByDescription(part, stockItems);
  }

  const resolvedReference =
    catalogReference || stockItem?.reference?.trim() || part.reference?.trim() || "";
  const resolvedSku = lecotSku ?? stockItem?.lecotSku ?? null;

  const imageUrl =
    lookupClientLecotProductImageOverlay({
      reference: resolvedReference || part.reference || "",
      lecotSku: resolvedSku,
      description: stockItem?.description?.trim() || part.description,
    }) ??
    stockItem?.imageUrl?.trim() ??
    null;

  return {
    ...part,
    reference: resolvedReference || part.reference || "",
    stockItemId: stockItem?.id ?? null,
    catalogReference: resolvedReference || null,
    catalogDescription: stockItem?.description?.trim() || null,
    lecotSku: resolvedSku,
    imageUrl,
  };
}

export function enrichMaterialPartSuggestions(
  parts: MaterialOrderPart[],
  stockItems: StockItem[] = []
): CatalogMatchedPart[] {
  return parts.map((part) => matchStockCatalogItem(part, stockItems));
}
