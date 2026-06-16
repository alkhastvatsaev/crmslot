import { LOCKSMITH_STOCK_SEED_CATALOG } from "@/features/catalog/locksmithStockSeedCatalog";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";
import {
  hasExactOverlayImage,
  resolveOverlayImageKey,
} from "@/features/catalog/lecotProductImageResolve";
import { labelOverlapScore } from "@/features/catalog/lecotProductImageMatch";
import type { LecotImageLookupInput } from "@/features/catalog/lecotProductImageTypes";

export type StockCatalogImageMatch = Pick<
  LecotImageLookupInput,
  "reference" | "description" | "lecotSku"
>;

function hasOverlayImage(reference: string, lecotSku?: string | null): boolean {
  return hasExactOverlayImage(reference, lecotSku);
}

function stockRowForReference(reference: string) {
  const key = normalizeLecotImageLookupKey(reference);
  return LOCKSMITH_STOCK_SEED_CATALOG.find(
    (row) => normalizeLecotImageLookupKey(row.reference) === key
  );
}

function fromStockReference(
  reference: string,
  description?: string
): StockCatalogImageMatch | null {
  const row = stockRowForReference(reference);
  if (!row || !hasOverlayImage(row.reference, row.lecotSku)) return null;
  return {
    reference: row.reference,
    lecotSku: row.lecotSku ?? null,
    description: description?.trim() || row.description,
  };
}

function fromLecotSku(sku: string, description?: string): StockCatalogImageMatch | null {
  if (!/^lec-/i.test(sku) || !resolveOverlayImageKey(sku)) return null;
  return {
    reference: sku,
    lecotSku: sku,
    description: description?.trim() || undefined,
  };
}

function isGenericOrderSku(sku: string): boolean {
  const value = sku.trim();
  if (!value) return true;
  if (/^lec-/i.test(value)) return false;
  if (resolveOverlayImageKey(value)) return false;
  if (/^[a-z]{2,}-[a-z0-9-]+$/i.test(value)) return false;
  return value.length <= 8;
}

function matchStockByLabel(label: string): StockCatalogImageMatch | null {
  const query = label.trim();
  if (query.length < 8) return null;

  const ranked = LOCKSMITH_STOCK_SEED_CATALOG.map((row) => ({
    row,
    score: labelOverlapScore(query, row.description),
  }))
    .filter((entry) => entry.score > 0 && hasOverlayImage(entry.row.reference, entry.row.lecotSku))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 6) return null;
  if (second && best.score < second.score * 1.5) return null;

  return {
    reference: best.row.reference,
    lecotSku: best.row.lecotSku ?? null,
    description: query,
  };
}

function matchLecotCatalogByLabel(label: string): StockCatalogImageMatch | null {
  const query = label.trim();
  if (query.length < 12) return null;

  const ranked = LECOT_CATALOG.map((row) => ({
    row,
    score: labelOverlapScore(query, row.label),
  }))
    .filter((entry) => entry.score > 0 && resolveOverlayImageKey(entry.row.sku))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 8) return null;
  if (second && best.score < second.score * 1.5) return null;

  return {
    reference: best.row.sku,
    lecotSku: best.row.sku,
    description: query,
  };
}

/** Associe une ligne de commande à une réf / SKU avec vignette locale exacte. */
export function matchStockCatalogImageLookup(input: {
  sku?: string | null;
  label?: string | null;
  description?: string | null;
  reference?: string | null;
}): StockCatalogImageMatch | null {
  const sku = input.sku?.trim() ?? "";
  const reference = input.reference?.trim() ?? "";
  const label = input.label?.trim() || input.description?.trim() || "";

  if (reference) {
    const fromRef = fromStockReference(reference, label);
    if (fromRef) return fromRef;
  }

  if (sku && !isGenericOrderSku(sku)) {
    const fromSkuRef = fromStockReference(sku, label);
    if (fromSkuRef) return fromSkuRef;
  }

  if (sku && /^lec-/i.test(sku)) {
    const fromLecot = fromLecotSku(sku, label);
    if (fromLecot) return fromLecot;
  }

  if (label) {
    const fromStock = matchStockByLabel(label);
    if (fromStock) return fromStock;

    const fromLecot = matchLecotCatalogByLabel(label);
    if (fromLecot) return fromLecot;
  }

  return null;
}

export function resolveOrderLineImageLookup(input: {
  sku?: string | null;
  label?: string | null;
  description?: string | null;
  reference?: string | null;
  fallbackId?: string;
}): LecotImageLookupInput {
  const matched = matchStockCatalogImageLookup(input);
  if (matched) return matched;

  const sku = input.sku?.trim() ?? "";
  const reference = input.reference?.trim() ?? "";
  const label = input.label?.trim() || input.description?.trim() || "";
  const lecotSku = /^lec-/i.test(sku) ? sku : null;

  return {
    reference: reference || sku || label || input.fallbackId?.trim() || "order",
    description: label || undefined,
    lecotSku,
  };
}
