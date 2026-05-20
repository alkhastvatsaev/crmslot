import * as admin from "firebase-admin";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";
import { lecotApiBaseUrl, searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
import { lecotDemoOrdersEnabled } from "@/features/catalog/lecotOrderFlags";
import { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";
import { buildLecotDemoReference } from "@/features/chatbot/chatbot-lecot-demo";
import { registerSupplierOrderInIntervention } from "@/features/chatbot/chatbot-order-sync";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { STUB_CATALOG } from "@/features/catalog/productQuickAdd";
import {
  mergeCatalogProducts,
  searchCatalogProductsScored,
} from "@/features/catalog/searchCatalogProducts";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import { buildLecotSearchUrl } from "@/features/chatbot/chatbot-lecot-url";
import { isChatbotEmailIntent } from "@/features/chatbot/chatbot-email-intent";
import {
  extractLecotProductQueryFromFollowUp,
  LECOT_FLOW_CONTEXT_RE,
  priorUserTexts,
  resolveLecotCatalogSearchQuery,
} from "@/features/chatbot/chatbot-lecot-follow-up";
import { buildLecotProductQuickActions } from "@/features/chatbot/chatbot-quick-actions";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { lecotShopBaseUrl } from "@/features/catalog/lecotShopConfig";
import { computeOrderTotal, type SupplierOrderLine } from "@/features/suppliers/types";

export { extractLecotProductQueryFromFollowUp } from "@/features/chatbot/chatbot-lecot-follow-up";

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

/**
 * Quand le modèle omet unitPriceCents (souvent), retrouve le prix depuis le catalogue
 * embarqué + produits société (SKU exact, sinon meilleur match sur le libellé).
 */
async function enrichLecotOrderLinesWithCatalogPrices(
  companyId: string,
  lines: SupplierOrderLine[],
): Promise<SupplierOrderLine[]> {
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
    if (line.unitPriceCents > 0) {
      out.push(line);
      continue;
    }
    const skuHit = bySku.get(line.sku.trim().toUpperCase());
    if (skuHit && skuHit.unitPriceCents > 0) {
      out.push({ ...line, unitPriceCents: skuHit.unitPriceCents });
      continue;
    }
    const labelQ = line.label.trim();
    if (labelQ.length >= 2) {
      const ranked = searchCatalogProductsScored(catalog, labelQ, 1);
      const best = ranked[0];
      if (best && best.unitPriceCents > 0) {
        out.push({ ...line, unitPriceCents: best.unitPriceCents });
        continue;
      }
    }
    const combo = `${line.sku} ${line.label}`
      .replace(/^CUSTOM-[A-Z0-9-]+\s+/i, "")
      .trim();
    if (combo.length >= 2) {
      const ranked2 = searchCatalogProductsScored(catalog, combo, 1);
      const best2 = ranked2[0];
      if (best2 && best2.unitPriceCents > 0) {
        out.push({ ...line, unitPriceCents: best2.unitPriceCents });
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

/** Nombre d'articles proposés dans le chat (boutons + liste). */
export const LECOT_CHATBOT_SUGGESTION_COUNT = 5;

/** Enrichit les requêtes courtes (ex. « perceuse ») pour le scoring catalogue. */
const LECOT_QUERY_ALIASES: Record<string, string> = {
  perceuse: "perceuse visseuse outillage",
  visseuse: "perceuse visseuse outillage",
  perforateur: "perceuse percussion SDS outillage",
  meuleuse: "meuleuse outillage",
  serrure: "serrure cylindre verrou serrurerie",
  verrou: "verrou serrure cylindre",
};

function expandLecotSearchQuery(query: string): string {
  const raw = query.trim();
  const key = raw.toLowerCase();
  return LECOT_QUERY_ALIASES[key] ?? raw;
}

export type LecotProductSuggestion = {
  rank: number;
  sku: string;
  label: string;
  unitPriceEur: number;
  unitPriceCents: number;
  lecotSearchUrl: string;
  markdownLink: string;
};

export function buildLecotProductSuggestions(
  products: Array<{
    sku: string;
    label: string;
    unitPriceEur: number;
    unitPriceCents?: number;
    lecotSearchUrl: string;
  }>,
  max = LECOT_CHATBOT_SUGGESTION_COUNT,
): LecotProductSuggestion[] {
  return products.slice(0, max).map((p, i) => {
    const unitPriceCents = p.unitPriceCents ?? Math.round(p.unitPriceEur * 100);
    return {
      rank: i + 1,
      sku: p.sku,
      label: p.label,
      unitPriceEur: p.unitPriceEur,
      unitPriceCents,
      lecotSearchUrl: p.lecotSearchUrl,
      markdownLink: `[${p.label}](lecot:${p.lecotSearchUrl})`,
    };
  });
}

function syntheticLecotSku(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28)
    .toUpperCase();
  return `CUSTOM-${slug || "PIECE"}`;
}

function formatProduct(p: CatalogProduct) {
  const label = p.label;
  return {
    sku: p.sku,
    label,
    unitPriceCents: p.unitPriceCents ?? 0,
    unitPriceEur: Math.round(p.unitPriceCents ?? 0) / 100,
    lecotSearchUrl: buildLecotSearchUrl(`${p.sku} ${label}`.trim()),
  };
}

export async function searchLecotProductsForChatbot(
  companyId: string,
  query: string,
  limitRaw?: number,
) {
  const limit = Math.min(12, Math.max(1, Number(limitRaw) || LECOT_CHATBOT_SUGGESTION_COUNT));
  const q = expandLecotSearchQuery(query);
  let companyProducts: CatalogProduct[] = [];
  if (companyId) {
    try {
      companyProducts = await loadCompanyCatalogProducts(companyId);
    } catch {
      companyProducts = [];
    }
  }
  const catalog = mergeCatalogProducts(LOCAL_CATALOG, companyProducts);

  if (q.length < 2) {
    const products = catalog.slice(0, LECOT_CHATBOT_SUGGESTION_COUNT).map(formatProduct);
    const suggestions = buildLecotProductSuggestions(products);
    return {
      products,
      suggestions,
      source: "local" as const,
      configured: Boolean(lecotApiBaseUrl()),
      hint: "Précisez le type de pièce (ex. perceuse, cylindre Yale).",
      instruction:
        "Présente jusqu'à 3 articles numérotés avec markdownLink et prix. L'utilisateur choisit le n° — appelle order_lecot_parts aussitôt (quantity=1, ne pas demander la quantité).",
    };
  }

  const remote = await searchLecotViaApi(q);
  if (remote && remote.length > 0) {
    const products = remote.slice(0, limit).map(formatProduct);
    const suggestions = buildLecotProductSuggestions(products);
    return {
      products,
      suggestions,
      source: "api" as const,
      configured: true,
      query: q,
      instruction:
        "Présente exactement les suggestions (markdownLink + prix). L'utilisateur choisit le n° — appelle order_lecot_parts aussitôt avec sku + label + unitPriceEur EXACT (quantity=1, ne pas demander).",
    };
  }

  const local = searchCatalogProductsScored(catalog, q, limit);
  const products = local.map(formatProduct);
  const suggestions = buildLecotProductSuggestions(products);

  if (products.length === 0) {
    if (isChatbotEmailIntent(q)) {
      return {
        products: [],
        suggestions: [],
        source: "local" as const,
        configured: Boolean(lecotApiBaseUrl()),
        query: q,
        matchCount: 0,
        hint: "Ce message concerne un email client, pas le catalogue Lecot. Utilisez send_intervention_email.",
        instruction: "Ne pas proposer de commande Lecot. Répondre via l'outil email.",
      };
    }
    const sku = syntheticLecotSku(q);
    return {
      products: [
        {
          sku,
          label: q,
          unitPriceCents: 0,
          unitPriceEur: 0,
          lecotSearchUrl: buildLecotSearchUrl(q),
        },
      ],
      source: "local_generated" as const,
      configured: Boolean(lecotApiBaseUrl()),
      query: q,
      matchCount: 0,
      noExactMatch: true,
      suggestions: buildLecotProductSuggestions([
        {
          sku,
          label: q,
          unitPriceEur: 0,
          lecotSearchUrl: buildLecotSearchUrl(q),
        },
      ]),
      hint: `Pas de référence catalogue — commande possible avec sku ${sku} et ce libellé via order_lecot_parts.`,
      instruction:
        "Aucun hit catalogue : propose le lien lecotSearchUrl et une commande sur description libre si l'utilisateur confirme.",
    };
  }

  return {
    products,
    suggestions,
    source: remote === null ? ("local" as const) : ("local_fallback" as const),
    configured: Boolean(lecotApiBaseUrl()),
    query: q,
    matchCount: products.length,
    hint:
      products.length === 1
        ? "Une correspondance — bouton Commander ou order_lecot_parts (quantity:1)."
        : "Plusieurs correspondances — boutons Commander ou order_lecot_parts (quantity:1).",
    instruction:
      products.length >= 2
        ? "Présente les suggestions (markdownLink + prix). Ne demande jamais la quantité. order_lecot_parts : sku + label + quantity:1 + unitPriceEur exact."
        : "Une correspondance — order_lecot_parts : sku + label + quantity:1 + unitPriceEur exact, sans demander la quantité.",
  };
}

export function formatLecotSearchReplyForChat(
  result: Awaited<ReturnType<typeof searchLecotProductsForChatbot>>,
): string {
  const suggestions = result.suggestions ?? [];
  if (suggestions.length === 0) {
    return "Aucun article trouvé dans le catalogue. Précisez le type de pièce (référence ou description).";
  }
  const lines = suggestions.map((s) => {
    const price =
      s.unitPriceEur > 0 ? ` — ${s.unitPriceEur.toFixed(2)} € HT` : " — prix à confirmer";
    return `${s.rank}. ${s.markdownLink}${price} (SKU ${s.sku})`;
  });
  const suggestionTags = suggestions
    .map((s) => `<suggestion>Commander ${s.rank}</suggestion>`)
    .join("");
  const footer =
    suggestions.length === 1
      ? "\n\nCommandez en 1 clic ci-dessous (quantité : 1)."
      : "\n\nChoisissez un article ci-dessous — commande immédiate, quantité 1.";
  return `**Catalogue Lecot** (recherche locale, 0 token) :\n${lines.join("\n")}${footer}${suggestionTags}`;
}

export async function runChatbotInstantLecotSearch(
  companyId: string,
  query: string,
  limit = LECOT_CHATBOT_SUGGESTION_COUNT,
): Promise<string> {
  const result = await searchLecotProductsForChatbot(companyId, query, limit);
  return formatLecotSearchReplyForChat(result);
}

/** Réponse SSE catalogue Lecot sans OpenAI (0 token) — liste + boutons rapides. */
export async function streamInstantLecotCatalogResponse(params: {
  companyId: string;
  query: string;
  messages: unknown[];
  enqueue: (ev: unknown) => void;
  suggestionLimit?: number;
}): Promise<void> {
  const limit = params.suggestionLimit ?? LECOT_CHATBOT_SUGGESTION_COUNT;
  const result = await searchLecotProductsForChatbot(params.companyId, params.query, limit);
  const reply = formatLecotSearchReplyForChat(result);
  const stored = normalizeStoredMessages(params.messages);
  const actions = buildLecotProductQuickActions(result.suggestions ?? []);
  params.enqueue({ type: "text", delta: reply });
  if (actions.length > 0) {
    params.enqueue({ type: "quick_actions", actions });
  }
  params.enqueue({
    type: "done",
    apiMessages: [...stored, { role: "assistant", content: reply }],
  });
}

export async function tryLecotProductFollowUpIntent(
  lastText: string,
  messages: unknown[],
  companyId: string,
): Promise<string | null> {
  const prior = priorUserTexts(messages);
  if (prior.length === 0 || !LECOT_FLOW_CONTEXT_RE.test(prior.join(" "))) return null;
  const query = resolveLecotCatalogSearchQuery(lastText, messages);
  if (!query) return null;
  return runChatbotInstantLecotSearch(companyId, query);
}

function parseOrderLines(raw: unknown): SupplierOrderLine[] {
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
    lines.push({ sku, label, quantity, unitPriceCents });
  }
  if (lines.length === 0) {
    throw new Error("Aucune ligne valide dans lines");
  }
  return lines;
}

async function assertInterventionAccess(companyId: string, interventionId: string) {
  const ref = admin.firestore().collection("interventions").doc(interventionId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé à ce dossier (autre société)");
  }
  return doc.data()!;
}

async function syncOrderToInterventionBilling(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>,
  interventionId: string,
  supplierOrderId: string,
  lines: SupplierOrderLine[],
  orderReference?: string | null,
): Promise<boolean> {
  if (!interventionId || input.syncBilling === false) return false;
  try {
    await registerSupplierOrderInIntervention(ctx, {
      interventionId,
      supplierOrderId,
      lines,
      supplierName: "Lecot",
      orderReference,
    });
    return true;
  } catch (err) {
    console.error("[chatbot/lecot] sync intervention billing:", err);
    return false;
  }
}

export async function orderLecotPartsForChatbot(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>,
) {
  const parsed = parseOrderLines(input.lines);
  const lines = await enrichLecotOrderLinesWithCatalogPrices(ctx.companyId, parsed);
  const notes =
    typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : null;
  const interventionId =
    typeof input.interventionId === "string" ? input.interventionId.trim() : "";
  const linkMaterialOrder = input.linkMaterialOrder !== false;

  if (interventionId) {
    await assertInterventionAccess(ctx.companyId, interventionId);
  }

  const totalCents = computeOrderTotal(lines);
  const firestore = admin.firestore();
  const ordersCol = firestore.collection("companies").doc(ctx.companyId).collection("supplierOrders");

  const orderRef = await ordersCol.add({
    companyId: ctx.companyId,
    supplierId: "lecot",
    supplierName: "Lecot",
    status: "draft",
    lines,
    totalCents,
    deliveryDate: null,
    notes,
    createdByUid: ctx.actorUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sentAt: null,
    deliveredAt: null,
    ...(interventionId ? { interventionId } : {}),
  });

  const lineRows = lines.map((l) => ({
    sku: l.sku,
    label: l.label,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    unitPriceEur: Math.round(l.unitPriceCents) / 100,
    lecotSearchUrl: buildLecotSearchUrl(`${l.sku} ${l.label}`.trim()),
  }));

  if (lecotDemoOrdersEnabled()) {
    const demoReference = buildLecotDemoReference(orderRef.id);
    const demoNote = `Simulation démo BELGMAP — ${demoReference}. Compte Lecot pro non connecté ; aucun envoi réel.`;
    await orderRef.update({
      status: "sent",
      isDemo: true,
      sentAt: new Date().toISOString(),
      notes: notes ? `${notes}\n${demoNote}` : demoNote,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    let materialOrderId: string | null = null;
    if (interventionId && linkMaterialOrder) {
      const now = new Date().toISOString();
      const materialRef = await firestore.collection("material_orders").add({
        interventionId,
        companyId: ctx.companyId,
        technicianUid: ctx.actorUid,
        partsRequested: lines.map((l) => ({
          description: l.label,
          quantity: l.quantity,
          reference: l.sku,
        })),
        urgency: "normal",
        status: "ordered",
        supplierOrderId: orderRef.id,
        createdAt: now,
        updatedAt: now,
      });
      materialOrderId = materialRef.id;
    }

    const billingSynced = await syncOrderToInterventionBilling(
      ctx,
      input,
      interventionId,
      orderRef.id,
      lines,
      demoReference,
    );

    const billingNote = billingSynced
      ? " Lignes ajoutées à la facture du dossier ; PDF bon de commande et facture à droite."
      : "";

    return {
      ok: true,
      documentType: "material_order",
      supplierOrderId: orderRef.id,
      status: "sent" as const,
      totalCents,
      totalEur: Math.round(totalCents) / 100,
      lineCount: lines.length,
      lines: lineRows,
      demoMode: true as const,
      demoReference,
      lecot: { ok: true, source: "demo" as const, orderId: demoReference },
      interventionId: interventionId || null,
      materialOrderId,
      billingSynced,
      portalUrl: lecotShopBaseUrl(),
      message: `Commande Lecot simulée (démo) — ${lineRows.length} ligne(s), ${Math.round(totalCents) / 100} € HT. Réf. ${demoReference}.${billingNote} Enregistrée dans la PWA (commandes + dossier).`,
    };
  }

  const lecot = await submitLecotSupplierOrder({ lines, notes, companyId: ctx.companyId });
  let status: "draft" | "sent" = "draft";
  const patch: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (lecot.ok && (lecot.source === "api" || lecot.source === "playwright")) {
    status = "sent";
    patch.status = "sent";
    patch.sentAt = new Date().toISOString();
    const note =
      lecot.source === "api"
        ? lecot.orderId
          ? `Lecot API #${lecot.orderId}`
          : "Envoyé via API Lecot"
        : lecot.orderId
          ? `Commandé sur lecot.be (ref. ${lecot.orderId})`
          : "Commandé sur lecot.be via automation";
    patch.notes = notes ? `${notes}\n${note}` : note;
  } else if (lecot.ok && lecot.source === "manual") {
    patch.notes = notes ? `${notes}\n${lecot.message}` : lecot.message;
  } else if (!lecot.ok) {
    patch.notes = notes
      ? `${notes}\nÉchec commande Lecot : ${lecot.error}`
      : `Échec commande Lecot : ${lecot.error}`;
  }

  await orderRef.update(patch);

  let materialOrderId: string | null = null;
  if (interventionId && linkMaterialOrder) {
    const now = new Date().toISOString();
    const materialRef = await firestore.collection("material_orders").add({
      interventionId,
      companyId: ctx.companyId,
      technicianUid: ctx.actorUid,
      partsRequested: lines.map((l) => ({
        description: l.label,
        quantity: l.quantity,
        reference: l.sku,
      })),
      urgency: "normal",
      status: lecot.ok && (lecot.source === "api" || lecot.source === "playwright") ? "ordered" : "pending",
      supplierOrderId: orderRef.id,
      createdAt: now,
      updatedAt: now,
    });
    materialOrderId = materialRef.id;
  }

  const lecotRef =
    lecot.ok && "orderId" in lecot && lecot.orderId
      ? String(lecot.orderId)
      : lecot.ok && lecot.source === "manual"
        ? "manuel"
        : null;

  const billingSynced = interventionId
    ? await syncOrderToInterventionBilling(
        ctx,
        input,
        interventionId,
        orderRef.id,
        lines,
        lecotRef,
      )
    : false;

  const manualFinalize =
    lecot.ok && lecot.source === "manual"
      ? " Finalisez sur lecot.be via les liens lecotSearchUrl."
      : "";
  const billingNote = billingSynced
    ? " Lignes sur la facture dossier ; bons de commande et facture ouverts à droite."
    : "";

  return {
    ok: true,
    documentType: "material_order",
    supplierOrderId: orderRef.id,
    status,
    totalCents,
    totalEur: Math.round(totalCents) / 100,
    lineCount: lines.length,
    lines: lineRows,
    lecot,
    interventionId: interventionId || null,
    materialOrderId,
    billingSynced,
    portalUrl: lecotShopBaseUrl(),
    message: `Commande Lecot enregistrée (${lineRows.length} ligne(s), ${Math.round(totalCents) / 100} € HT).${billingNote}${manualFinalize} Tout est dans la PWA (Firestore). Formate chaque article avec [Libellé](lecot:URL) en utilisant lecotSearchUrl.`,
  };
}

export async function listSupplierOrdersForChatbot(
  companyId: string,
  input: Record<string, unknown>,
) {
  const limit = Math.min(20, Math.max(1, Number(input.limit) || 10));
  const supplierId =
    typeof input.supplierId === "string" && input.supplierId.trim()
      ? input.supplierId.trim()
      : "lecot";

  const snap = await admin
    .firestore()
    .collection("companies")
    .doc(companyId)
    .collection("supplierOrders")
    .orderBy("createdAt", "desc")
    .limit(Math.min(40, limit * 3))
    .get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
    .filter((r) => String(r.supplierId || "") === supplierId)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      status: r.status,
      supplierName: r.supplierName,
      totalEur: Math.round(Number(r.totalCents ?? 0)) / 100,
      lineCount: Array.isArray(r.lines) ? r.lines.length : 0,
      interventionId: r.interventionId ?? null,
      sentAt: r.sentAt ?? null,
    }));

  return { supplierId, orders: rows };
}
