import { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
import { STUB_CATALOG, type CatalogProduct } from "@/features/catalog/productQuickAdd";
import {
  mergeCatalogProducts,
  searchCatalogProductsScored,
} from "@/features/catalog/searchCatalogProducts";
import { syntheticLecotSku } from "@/features/chatbot/chatbot-lecot-catalog";
import { buildLecotSearchUrl } from "@/features/chatbot/chatbot-lecot-url";
import type { SupplierOrderLine } from "@/features/suppliers";

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

type EnrichLecotOrderLinesOptions = {
  /** Référence stock inventaire (dock central) — vignette même si le SKU commandé diffère. */
  stockReference?: string | null;
};

function resolveLecotOrderLineImageUrl(
  line: SupplierOrderLine,
  stockReference?: string | null
): string | null {
  if (line.imageUrl?.trim()) return line.imageUrl.trim();

  const stockRef = stockReference?.trim();
  if (stockRef) {
    const fromStockRef = lookupClientLecotProductImageOverlay({
      reference: stockRef,
      description: line.label,
    });
    if (fromStockRef) return fromStockRef;
  }

  const sku = line.sku.trim();
  return lookupClientLecotProductImageOverlay({
    reference: sku,
    lecotSku: /^lec-/i.test(sku) ? sku : null,
    description: line.label,
  });
}

function enrichLineFromCatalogHit(
  line: SupplierOrderLine,
  hit: CatalogProduct,
  stockReference?: string | null
): SupplierOrderLine {
  const imageUrl =
    line.imageUrl?.trim() ||
    hit.imageUrl?.trim() ||
    resolveLecotOrderLineImageUrl(line, stockReference);
  return {
    ...line,
    unitPriceCents: hit.unitPriceCents > 0 ? hit.unitPriceCents : line.unitPriceCents,
    ...(imageUrl ? { imageUrl } : {}),
  };
}

function enrichLineImage(
  line: SupplierOrderLine,
  stockReference?: string | null
): SupplierOrderLine {
  const imageUrl = resolveLecotOrderLineImageUrl(line, stockReference);
  return imageUrl ? { ...line, imageUrl } : line;
}

export async function enrichLecotOrderLinesWithCatalogPrices(
  companyId: string,
  lines: SupplierOrderLine[],
  options?: EnrichLecotOrderLinesOptions
): Promise<SupplierOrderLine[]> {
  const stockReference = options?.stockReference ?? null;
  let companyProducts: CatalogProduct[] = [];
  try {
    companyProducts = await loadCompanyCatalogProducts(companyId);
  } catch {
    companyProducts = [];
  }
  const catalog = mergeCatalogProducts(LOCAL_CATALOG, companyProducts);
  const bySku = new Map<string, CatalogProduct>();
  for (const p of catalog) {
    const k = p.sku.trim().toUpperCase();
    if (k) bySku.set(k, p);
  }

  const out: SupplierOrderLine[] = [];
  for (const line of lines) {
    const skuHit = bySku.get(line.sku.trim().toUpperCase());
    if (skuHit && skuHit.unitPriceCents > 0) {
      out.push(enrichLineFromCatalogHit(line, skuHit, stockReference));
      continue;
    }
    const labelQ = line.label.trim();
    if (labelQ.length >= 2) {
      const ranked = searchCatalogProductsScored(catalog, labelQ, 1);
      const best = ranked[0];
      if (best && best.unitPriceCents > 0) {
        out.push(enrichLineFromCatalogHit(line, best, stockReference));
        continue;
      }
    }
    const combo = `${line.sku} ${line.label}`.replace(/^CUSTOM-[A-Z0-9-]+\s+/i, "").trim();
    if (combo.length >= 2) {
      const ranked2 = searchCatalogProductsScored(catalog, combo, 1);
      const best2 = ranked2[0];
      if (best2 && best2.unitPriceCents > 0) {
        out.push(enrichLineFromCatalogHit(line, best2, stockReference));
        continue;
      }
    }
    out.push(enrichLineImage(line, stockReference));
  }
  return out;
}

export function parseOrderLines(raw: unknown): SupplierOrderLine[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("lines requis : tableau { sku, label, quantity, unitPriceCents? }");
  }
  const lines: SupplierOrderLine[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    let sku = String(o.sku ?? o.reference ?? "").trim();
    const label = String(o.label ?? o.description ?? "").trim();
    const quantity = Math.max(1, Math.floor(Number(o.quantity) || 1));
    let unitPriceCents = Number(o.unitPriceCents);
    if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0) {
      unitPriceCents = 0;
    }
    if (unitPriceCents === 0) {
      const eur = Number(o.unitPriceEur ?? o.unitPrice);
      if (Number.isFinite(eur) && eur >= 0) {
        unitPriceCents = Math.round(eur * 100);
      }
    }
    if (!label) {
      throw new Error("Chaque ligne doit avoir un label (libellé pièce).");
    }
    if (!sku) {
      sku = syntheticLecotSku(label);
    }
    const imageUrl = typeof o.imageUrl === "string" && o.imageUrl.trim() ? o.imageUrl.trim() : null;
    lines.push({ sku, label, quantity, unitPriceCents, ...(imageUrl ? { imageUrl } : {}) });
  }
  if (lines.length === 0) {
    throw new Error("Aucune ligne valide dans lines");
  }
  return lines;
}

export function buildLecotOrderLineRows(lines: SupplierOrderLine[]) {
  return lines.map((l) => ({
    sku: l.sku,
    label: l.label,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    unitPriceEur: Math.round(l.unitPriceCents) / 100,
    lecotSearchUrl: buildLecotSearchUrl(`${l.sku} ${l.label}`.trim()),
  }));
}
