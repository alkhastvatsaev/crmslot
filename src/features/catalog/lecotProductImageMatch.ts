import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";

export type LecotSearchProductHit = {
  sku: string;
  label: string;
  imageUrl: string;
  pageUrl?: string | null;
};

const catalogSkuKeys = new Set(
  LECOT_CATALOG.map((row) => normalizeLecotImageLookupKey(row.sku)).filter(Boolean)
);

const catalogBySku = new Map(
  LECOT_CATALOG.map((row) => [normalizeLecotImageLookupKey(row.sku), row] as const).filter(
    ([key]) => Boolean(key)
  )
);

/** Libellé catalogue local pour un SKU LEC-*. */
export function catalogLabelForLecotSku(sku: string): string | null {
  const row = catalogBySku.get(normalizeLecotImageLookupKey(sku));
  return row?.label?.trim() || null;
}

/** SKU Lecot utilisé pour chercher la vignette (jamais la description seule). */
export function resolveLecotCatalogSku(
  input: Pick<LecotImageLookupInput, "reference" | "lecotSku">
): string | null {
  const mapped = input.lecotSku?.trim();
  if (mapped) return mapped;

  const ref = input.reference.trim();
  if (!ref) return null;

  const refKey = normalizeLecotImageLookupKey(ref);
  if (/^lec-/i.test(ref)) return ref;
  if (catalogSkuKeys.has(refKey)) return ref;

  return null;
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function labelOverlapScore(description: string, label: string): number {
  const descTokens = new Set(
    normalizeLabel(description)
      .split(/\s+/)
      .filter((t) => t.length >= 3)
  );
  const labelTokens = normalizeLabel(label)
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  let score = 0;
  for (const token of labelTokens) {
    if (descTokens.has(token)) score += token.length >= 5 ? 3 : 1;
  }
  return score;
}

/**
 * Choisit la vignette d'un hit Lecot — correspondance SKU stricte uniquement.
 * Pas de « premier résultat » : sans SKU exact → null (picto famille).
 */
export function pickLecotProductImageHit(
  targetSku: string,
  targetDescription: string | undefined,
  hits: LecotSearchProductHit[]
): string | null {
  const skuNorm = normalizeLecotImageLookupKey(targetSku);
  if (!skuNorm || hits.length === 0) return null;

  const exact = hits.filter((hit) => normalizeLecotImageLookupKey(hit.sku) === skuNorm);
  if (exact.length === 0) return null;
  if (exact.length === 1) return exact[0]?.imageUrl ?? null;

  if (targetDescription?.trim()) {
    const ranked = exact
      .map((hit) => ({ hit, score: labelOverlapScore(targetDescription, hit.label) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const second = ranked[1];
    if (best && best.score > 0 && (!second || best.score >= second.score * 1.5)) {
      return best.hit.imageUrl;
    }
  }

  return null;
}

/** Meilleur hit par similarité de libellé (site lecot = SKU internes, pas LEC-*). */
export function pickBestLecotProductImageByLabel(
  queryLabel: string,
  hits: LecotSearchProductHit[]
): string | null {
  const query = queryLabel.trim();
  if (!query || hits.length === 0) return null;

  const ranked = hits
    .map((hit) => ({ hit, score: labelOverlapScore(query, hit.label) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 4) return null;
  if (second && best.score < second.score * 1.35) return null;

  return best.hit.imageUrl;
}

/** SKU exact d'abord, puis libellé catalogue / description. */
export function pickLecotProductImageFromHits(
  catalogSku: string,
  targetDescription: string | undefined,
  hits: LecotSearchProductHit[]
): string | null {
  const bySku = pickLecotProductImageHit(catalogSku, targetDescription, hits);
  if (bySku) return bySku;

  const catalogLabel = catalogLabelForLecotSku(catalogSku);
  const byCatalogLabel = catalogLabel ? pickBestLecotProductImageByLabel(catalogLabel, hits) : null;
  if (byCatalogLabel) return byCatalogLabel;

  if (targetDescription?.trim()) {
    return pickBestLecotProductImageByLabel(targetDescription, hits);
  }

  return null;
}
