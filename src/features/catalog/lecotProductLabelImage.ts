import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { lookupOverlayImageUrl } from "@/features/catalog/lecotProductImageResolve";
import { labelOverlapScore } from "@/features/catalog/lecotProductImageMatch";
import { lookupLecotProductImageIndexUrlByLabel } from "@/features/catalog/lecotProductImageIndex";
import { LOCKSMITH_STOCK_SEED_CATALOG } from "@/features/catalog/locksmithStockSeedCatalog";

/** Clé stable pour indexer les vignettes par libellé article. */
export function normalizeProductLabelKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function lookupClientProductLabelImage(label: string): string | null {
  return lookupLecotProductImageIndexUrlByLabel(label);
}

function stockRowByExactLabel(label: string) {
  const key = normalizeProductLabelKey(label);
  if (!key) return null;
  return (
    LOCKSMITH_STOCK_SEED_CATALOG.find((row) => normalizeProductLabelKey(row.description) === key) ??
    null
  );
}

function lecotRowByExactLabel(label: string) {
  const key = normalizeProductLabelKey(label);
  if (!key) return null;
  return LECOT_CATALOG.find((row) => normalizeProductLabelKey(row.label) === key) ?? null;
}

function stockRowByLabelOverlap(label: string) {
  const query = label.trim();
  if (query.length < 10) return null;

  const ranked = LOCKSMITH_STOCK_SEED_CATALOG.map((row) => ({
    row,
    score: labelOverlapScore(query, row.description),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 8) return null;
  if (second && best.score < second.score * 1.5) return null;
  return best.row;
}

/** Résout une vignette à partir du titre affiché (stock / catalogue Lecot / cache libellé). */
export function resolveProductImageByOrderLabel(label: string): string | null {
  const query = label.trim();
  if (!query) return null;

  const fromLabelCache = lookupClientProductLabelImage(query);
  if (fromLabelCache) return fromLabelCache;

  const stockExact = stockRowByExactLabel(query);
  if (stockExact) {
    return (
      lookupOverlayImageUrl(stockExact.reference) ??
      lookupOverlayImageUrl(stockExact.lecotSku ?? "")
    );
  }

  const lecotExact = lecotRowByExactLabel(query);
  if (lecotExact) {
    return lookupOverlayImageUrl(lecotExact.sku);
  }

  const stockFuzzy = stockRowByLabelOverlap(query);
  if (stockFuzzy) {
    return (
      lookupOverlayImageUrl(stockFuzzy.reference) ??
      lookupOverlayImageUrl(stockFuzzy.lecotSku ?? "")
    );
  }

  return null;
}
