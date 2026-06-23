import { labelOverlapScore } from "@/features/catalog/lecotProductImageMatch";
import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
import { hasExactOverlayImage } from "@/features/catalog/lecotProductImageResolve";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import { locksmithStockCatalogRows } from "@/features/catalog/locksmithStockSeedCatalog";
import type { Intervention } from "@/features/interventions";
import type { CatalogMatchedPart } from "@/features/materials/matchStockCatalogItem";
import type { StockItem } from "@/features/materials/stockFirestore";

type InterventionContext = Pick<Intervention, "problem" | "title" | "transcription" | "category">;

const KEYWORD_STOCK_BOOSTS: Array<{ pattern: RegExp; reference: string; boost: number }> = [
  { pattern: /cylindr|barillet|europ[eé]en/, reference: "CYL-EURO-80", boost: 14 },
  { pattern: /cylindr|barillet/, reference: "BAR-A2P", boost: 10 },
  { pattern: /multipoint|cremone|cr[eé]mone|3\s*point/, reference: "CREM-3PT", boost: 14 },
  { pattern: /g[aâ]che/, reference: "GACH-ELEC", boost: 12 },
  { pattern: /serrure|verrou/, reference: "SERR-APL", boost: 10 },
  { pattern: /poign[eé]e/, reference: "LECOT-POIG", boost: 12 },
  { pattern: /effrac|cambriol|forc|vandal/, reference: "CYL-EURO-80", boost: 8 },
  { pattern: /claqu|bloqu|ouvertur/, reference: "LUB-CYL", boost: 6 },
  { pattern: /badge|rfid|contr[oô]le/, reference: "BADGE-125", boost: 8 },
  { pattern: /t[eé]l[eé]commande|portail/, reference: "TELE-4CH", boost: 10 },
];

const DEFAULT_SUGGESTION_REFS = ["CYL-EURO-80", "CREM-3PT", "GACH-ELEC"] as const;

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function refKey(value: string): string {
  return normalizeLecotImageLookupKey(value);
}

function readInterventionHaystack(iv: InterventionContext): string {
  return normalize([iv.problem, iv.title, iv.transcription, iv.category].filter(Boolean).join(" "));
}

function resolveStockPool(stockItems: StockItem[]): StockItem[] {
  if (stockItems.length > 0) return stockItems;
  return locksmithStockCatalogRows();
}

/** Article du catalogue perso avec vignette connue (overlay local ou imageUrl Firestore). */
export function stockItemHasDisplayImage(item: StockItem): boolean {
  if (item.imageUrl?.trim()) return true;
  return hasExactOverlayImage(item.reference, item.lecotSku);
}

function resolveStockItemImageUrl(item: StockItem): string | null {
  const direct = item.imageUrl?.trim();
  if (direct) return direct;
  return lookupClientLecotProductImageOverlay({
    reference: item.reference,
    lecotSku: item.lecotSku,
    description: item.description,
  });
}

function stockItemToCatalogPart(item: StockItem): CatalogMatchedPart {
  return {
    description: item.description,
    quantity: 1,
    reference: item.reference,
    stockItemId: item.id,
    catalogReference: item.reference,
    catalogDescription: item.description,
    lecotSku: item.lecotSku ?? null,
    imageUrl: resolveStockItemImageUrl(item),
  };
}

function scoreStockItem(item: StockItem, hay: string): number {
  let score = labelOverlapScore(hay, item.description);

  const desc = normalize(item.description);
  for (const token of desc.split(/[\s/()-]+/).filter((w) => w.length > 4)) {
    if (hay.includes(token)) score += 2;
  }

  for (const { pattern, reference, boost } of KEYWORD_STOCK_BOOSTS) {
    if (refKey(item.reference) === refKey(reference) && pattern.test(hay)) {
      score += boost;
    }
  }

  return score;
}

/**
 * Jusqu'à 3 articles du catalogue stock société (page Matériel) — uniquement avec vignette.
 */
export function suggestMaterialPartsFromIntervention(
  iv: InterventionContext,
  stockItems: StockItem[] = [],
  limit = 3
): CatalogMatchedPart[] {
  const hay = readInterventionHaystack(iv);
  if (!hay.trim()) return [];

  const pool = resolveStockPool(stockItems).filter(stockItemHasDisplayImage);
  if (pool.length === 0) return [];

  const ranked = pool
    .map((item) => ({ item, score: hay.trim() ? scoreStockItem(item, hay) : 0 }))
    .sort((a, b) => b.score - a.score);

  const out: CatalogMatchedPart[] = [];
  const seen = new Set<string>();

  const pushItem = (item: StockItem) => {
    const key = refKey(item.reference);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(stockItemToCatalogPart(item));
  };

  for (const { item, score } of ranked) {
    if (out.length >= limit) break;
    if (hay.trim() && score <= 0) continue;
    pushItem(item);
  }

  if (out.length < limit) {
    for (const ref of DEFAULT_SUGGESTION_REFS) {
      if (out.length >= limit) break;
      const item = pool.find((row) => refKey(row.reference) === refKey(ref));
      if (item) pushItem(item);
    }
  }

  if (out.length < limit) {
    for (const { item } of ranked) {
      if (out.length >= limit) break;
      pushItem(item);
    }
  }

  return out.slice(0, limit);
}
