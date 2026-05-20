import * as admin from "firebase-admin";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import {
  billingLinesTotalCents,
  normalizeBillingLinesFromFirestore,
  type ChatbotBillingLine,
} from "@/features/chatbot/chatbot-billing";

export type SupplierOrderLineForSync = {
  sku: string;
  label: string;
  quantity: number;
  unitPriceCents: number;
};

/**
 * Enregistre la commande fournisseur dans le dossier : lignes facture + note timeline.
 * Tout reste dans Firestore (PWA, onglets Commandes / Factures / Bon de commande).
 */
export async function registerSupplierOrderInIntervention(
  ctx: ChatbotToolContext,
  params: {
    interventionId: string;
    supplierOrderId: string;
    lines: SupplierOrderLineForSync[];
    supplierName?: string;
    orderReference?: string | null;
  },
): Promise<{ ok: true; linesAppended: number; totalEur: number }> {
  const interventionId = params.interventionId.trim();
  const supplierOrderId = params.supplierOrderId.trim();
  if (!interventionId || !supplierOrderId) {
    throw new Error("interventionId et supplierOrderId requis");
  }
  if (!params.lines.length) {
    throw new Error("Aucune ligne à synchroniser");
  }

  const snap = await admin.firestore().collection("interventions").doc(interventionId).get();
  if (!snap.exists) throw new Error("Intervention introuvable");
  const data = snap.data()!;
  if (String(data.companyId || "").trim() !== ctx.companyId) {
    throw new Error("Accès refusé à ce dossier");
  }

  const supplier = params.supplierName?.trim() || "Lecot";
  const existing = normalizeBillingLinesFromFirestore(data.billingLines);
  const newLines: ChatbotBillingLine[] = params.lines.map((l) => ({
    description: `${supplier} — ${l.label}`,
    quantity: l.quantity,
    unitPriceCents: l.unitPriceCents,
    reference: l.sku,
  }));
  const billingLines = [...existing, ...newLines];
  const totalCents = billingLinesTotalCents(billingLines);
  const now = new Date().toISOString();

  await snap.ref.update({
    billingLines,
    invoiceAmountCents: totalCents,
    statusUpdatedAt: now,
    lastSupplierOrderId: supplierOrderId,
  });

  const refLabel = params.orderReference?.trim() || supplierOrderId.slice(0, 10);
  const totalHt = Math.round(totalCents) / 100;
  await snap.ref.collection("timeline_events").add({
    interventionId,
    type: "comment",
    content: `[PWA] Commande ${supplier} enregistrée — ${params.lines.length} ligne(s), ref. ${refLabel}. Montant dossier : ${totalHt} € HT.`,
    visibility: "internal",
    createdAt: now,
    createdByUid: ctx.actorUid,
    companyId: ctx.companyId,
  });

  return { ok: true, linesAppended: newLines.length, totalEur: totalHt };
}
