import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { STUB_CATALOG } from "@/features/catalog/productQuickAdd";
import { mergeCatalogProducts } from "@/features/catalog/searchCatalogProducts";
import {
  LECOT_FLOW_CONTEXT_RE,
  priorUserTexts,
} from "@/features/chatbot/chatbot-lecot-follow-up";
import {
  parseLecotInstantOrderIntent,
  type LecotInstantOrderIntent,
} from "@/features/chatbot/chatbot-lecot-instant-order-intent";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";

export { parseLecotInstantOrderIntent, type LecotInstantOrderIntent };

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

const CATALOG_LINE_RE =
  /^(\d+)\.\s+\[([^\]]+)\]\([^)]+\)[^\n]*\(SKU\s+([A-Z0-9][A-Z0-9-]*)\)/gim;

export type LecotInstantOrderLine = {
  sku: string;
  label: string;
  quantity: 1;
  unitPriceEur: number;
};

export function extractCatalogLinesFromAssistantText(
  text: string,
): Array<{ rank: number; sku: string; label: string }> {
  const rows: Array<{ rank: number; sku: string; label: string }> = [];
  const re = new RegExp(CATALOG_LINE_RE.source, CATALOG_LINE_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    rows.push({
      rank: Number(m[1]),
      label: m[2].trim(),
      sku: m[3].trim().toUpperCase(),
    });
  }
  return rows;
}

function lastAssistantText(messages: unknown[]): string {
  const stored = normalizeStoredMessages(messages);
  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role === "assistant" && typeof m.content === "string" && m.content.trim()) {
      return m.content.trim();
    }
  }
  return "";
}

function hasLecotOrderContext(messages: unknown[]): string {
  const assistant = lastAssistantText(messages);
  if (/catalogue\s+lecot/i.test(assistant)) return assistant;
  const prior = priorUserTexts(messages).join(" ");
  if (LECOT_FLOW_CONTEXT_RE.test(prior) || LECOT_FLOW_CONTEXT_RE.test(assistant)) {
    return assistant;
  }
  return "";
}

async function loadMergedCatalog(companyId: string): Promise<CatalogProduct[]> {
  let companyProducts: CatalogProduct[] = [];
  try {
    companyProducts = await loadCompanyCatalogProducts(companyId);
  } catch {
    companyProducts = [];
  }
  return mergeCatalogProducts(LOCAL_CATALOG, companyProducts);
}

function catalogLineToOrderLine(product: CatalogProduct): LecotInstantOrderLine {
  return {
    sku: product.sku,
    label: product.label,
    quantity: 1,
    unitPriceEur: Math.round(product.unitPriceCents) / 100,
  };
}

/**
 * Construit les lignes order_lecot_parts (qty 1) pour une commande sans OpenAI.
 * Retourne null si le message n'est pas une commande Lecot explicite ou produit introuvable.
 */
export async function buildInstantLecotOrderPayload(
  companyId: string,
  lastUserText: string,
  messages: unknown[],
  opts?: { focusInterventionId?: string | null },
): Promise<{ lines: LecotInstantOrderLine[]; interventionId?: string } | null> {
  const intent = parseLecotInstantOrderIntent(lastUserText);
  if (!intent) return null;

  const contextAssistant = hasLecotOrderContext(messages);
  if (!contextAssistant && intent.kind === "rank") return null;
  if (!contextAssistant && intent.kind === "sku") {
    const prior = priorUserTexts(messages).join(" ");
    if (!LECOT_FLOW_CONTEXT_RE.test(prior)) return null;
  }

  const catalog = await loadMergedCatalog(companyId);
  const bySku = new Map<string, CatalogProduct>();
  for (const p of catalog) {
    const k = p.sku.trim().toUpperCase();
    if (k) bySku.set(k, p);
  }

  let product: CatalogProduct | null = null;

  if (intent.kind === "sku") {
    product =
      bySku.get(intent.sku) ??
      catalog.find(
        (p) =>
          p.sku.trim().toUpperCase() === intent.sku ||
          p.label.trim().toLowerCase() === intent.label.trim().toLowerCase(),
      ) ??
      null;
    if (!product) {
      product = {
        sku: intent.sku,
        label: intent.label,
        unitPriceCents: 0,
      };
    }
  } else {
    const catalogLines = extractCatalogLinesFromAssistantText(contextAssistant);
    const hit = catalogLines.find((r) => r.rank === intent.rank);
    if (!hit) return null;
    product = bySku.get(hit.sku) ?? {
      sku: hit.sku,
      label: hit.label,
      unitPriceCents: 0,
    };
  }

  const interventionId = (opts?.focusInterventionId ?? "").trim() || undefined;
  return {
    lines: [catalogLineToOrderLine(product)],
    ...(interventionId ? { interventionId } : {}),
  };
}
