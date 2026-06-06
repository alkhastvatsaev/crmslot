import * as admin from "firebase-admin";
import { logger } from "@/core/logger";
import { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";
import { lecotDemoOrdersEnabled } from "@/features/catalog/lecotOrderFlags";
import { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";
import { buildLecotDemoReference } from "@/features/chatbot/chatbot-lecot-demo";
import { registerSupplierOrderInIntervention } from "@/features/chatbot/chatbot-order-sync";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import {
  mergeCatalogProducts,
  searchCatalogProductsScored,
} from "@/features/catalog/searchCatalogProducts";
import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { STUB_CATALOG } from "@/features/catalog/productQuickAdd";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import { buildLecotSearchUrl } from "@/features/chatbot/chatbot-lecot-url";
import { lecotShopBaseUrl } from "@/features/catalog/lecotShopConfig";
import { resolveInterventionClientNameFromRecord } from "@/features/interventions/resolveInterventionClientName";
import { requireMaterialOrderClientName } from "@/features/materials/materialOrderClientName";
import { computeOrderTotal, type SupplierOrderLine } from "@/features/suppliers/types";
import {
  logCrmMaterialOrderPlacedAdmin,
  logCrmSupplierOrderPlacedAdmin,
} from "@/features/crmHistory/logCrmSupplierAndMaterialOrder";
import { sendLecotOrderEmail, LECOT_EMAIL } from "@/features/chatbot/sendLecotOrderEmail";

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

async function enrichLecotOrderLinesWithCatalogPrices(
  companyId: string,
  lines: SupplierOrderLine[]
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
    const combo = `${line.sku} ${line.label}`.replace(/^CUSTOM-[A-Z0-9-]+\s+/i, "").trim();
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
  orderReference?: string | null
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
    logger.error("[chatbot/lecot] sync intervention billing:", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function orderLecotPartsForChatbot(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const parsed = parseOrderLines(input.lines);
  const lines = await enrichLecotOrderLinesWithCatalogPrices(ctx.companyId, parsed);
  const notes = typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : null;
  const interventionId =
    typeof input.interventionId === "string" ? input.interventionId.trim() : "";
  const linkMaterialOrder = input.linkMaterialOrder !== false;

  const explicitClient = typeof input.clientName === "string" ? input.clientName.trim() : "";
  let orderClientName: string | undefined;
  if (explicitClient) {
    orderClientName = requireMaterialOrderClientName(explicitClient);
  } else if (interventionId) {
    const ivData = await assertInterventionAccess(ctx.companyId, interventionId);
    orderClientName = requireMaterialOrderClientName(
      resolveInterventionClientNameFromRecord(ivData)
    );
  } else if (ctx.requireMaterialOrderClientName) {
    orderClientName = requireMaterialOrderClientName("");
  }

  const totalCents = computeOrderTotal(lines);
  const firestore = admin.firestore();
  const ordersCol = firestore
    .collection("companies")
    .doc(ctx.companyId)
    .collection("supplierOrders");

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
    ...(orderClientName ? { clientName: orderClientName, nom: orderClientName } : {}),
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
        clientName: orderClientName,
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
      demoReference
    );

    const billingNote = billingSynced
      ? " Lignes ajoutées à la facture du dossier ; PDF bon de commande et facture à droite."
      : interventionId
        ? " ⚠ Sync facturation échouée — vérifiez manuellement les lignes sur le dossier."
        : "";

    await logCrmSupplierOrderPlacedAdmin({
      ctx,
      supplierOrderId: orderRef.id,
      lines,
      totalCents,
      status: "sent",
      interventionId: interventionId || null,
      materialOrderId,
      clientName: orderClientName ?? null,
      demoMode: true,
    });
    if (materialOrderId && interventionId) {
      await logCrmMaterialOrderPlacedAdmin({
        ctx,
        materialOrderId,
        interventionId,
        partsSummary: lines.map((l) => `${l.quantity}× ${l.label}`).join(", "),
        status: "ordered",
        clientName: orderClientName ?? null,
        supplierOrderId: orderRef.id,
      });
    }

    const emailResult = await sendLecotOrderEmail({
      orderId: orderRef.id,
      companyId: ctx.companyId,
      lines,
      totalCents,
      clientName: orderClientName ?? null,
      notes,
      reference: demoReference,
    });
    const emailNote = emailResult.ok
      ? ` Email bon de commande envoyé à ${LECOT_EMAIL}.`
      : emailResult.error
        ? ` (Email non envoyé : ${emailResult.error})`
        : "";

    return {
      ok: true,
      documentType: "material_order",
      supplierOrderId: orderRef.id,
      clientName: orderClientName ?? null,
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
      message: `Commande Lecot simulée (démo) — ${lineRows.length} ligne(s), ${Math.round(totalCents) / 100} € HT. Réf. ${demoReference}.${billingNote}${emailNote} Enregistrée dans la PWA (commandes + dossier).`,
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
      clientName: orderClientName,
      technicianUid: ctx.actorUid,
      partsRequested: lines.map((l) => ({
        description: l.label,
        quantity: l.quantity,
        reference: l.sku,
      })),
      urgency: "normal",
      status:
        lecot.ok && (lecot.source === "api" || lecot.source === "playwright")
          ? "ordered"
          : "pending",
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
    ? await syncOrderToInterventionBilling(ctx, input, interventionId, orderRef.id, lines, lecotRef)
    : false;

  const manualFinalize =
    lecot.ok && lecot.source === "manual"
      ? " Finalisez sur lecot.be via les liens lecotSearchUrl."
      : "";
  const billingNote = billingSynced
    ? " Lignes sur la facture dossier ; bons de commande et facture ouverts à droite."
    : interventionId
      ? " ⚠ Sync facturation échouée — vérifiez manuellement les lignes sur le dossier."
      : "";

  await logCrmSupplierOrderPlacedAdmin({
    ctx,
    supplierOrderId: orderRef.id,
    lines,
    totalCents,
    status,
    interventionId: interventionId || null,
    materialOrderId,
    clientName: orderClientName ?? null,
  });
  if (materialOrderId && interventionId) {
    await logCrmMaterialOrderPlacedAdmin({
      ctx,
      materialOrderId,
      interventionId,
      partsSummary: lines.map((l) => `${l.quantity}× ${l.label}`).join(", "),
      status:
        lecot.ok && (lecot.source === "api" || lecot.source === "playwright")
          ? "ordered"
          : "pending",
      clientName: orderClientName ?? null,
      supplierOrderId: orderRef.id,
    });
  }

  const emailResult = await sendLecotOrderEmail({
    orderId: orderRef.id,
    companyId: ctx.companyId,
    lines,
    totalCents,
    clientName: orderClientName ?? null,
    notes,
    reference: lecotRef,
  });
  const emailNote = emailResult.ok
    ? ` Email bon de commande envoyé à ${LECOT_EMAIL}.`
    : emailResult.error
      ? ` (Email non envoyé : ${emailResult.error})`
      : "";

  return {
    ok: true,
    documentType: "material_order",
    supplierOrderId: orderRef.id,
    clientName: orderClientName ?? null,
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
    message: `Commande Lecot enregistrée (${lineRows.length} ligne(s), ${Math.round(totalCents) / 100} € HT).${billingNote}${emailNote}${manualFinalize} Tout est dans la PWA (Firestore). Formate chaque article avec [Libellé](lecot:URL) en utilisant lecotSearchUrl.`,
  };
}

export async function listSupplierOrdersForChatbot(
  companyId: string,
  input: Record<string, unknown>
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
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
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
