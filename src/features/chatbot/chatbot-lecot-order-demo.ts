import * as admin from "firebase-admin";
import { lecotDemoOrdersEnabled } from "@/features/catalog/lecotOrderFlags";
import { buildLecotPreviewReference } from "@/features/chatbot/chatbot-lecot-preview";
import {
  billingSyncNote,
  createLinkedMaterialOrder,
  logLecotOrderPlacedCrm,
  sendLecotOrderEmailAndMarkPending,
  syncOrderToInterventionBilling,
} from "@/features/chatbot/chatbot-lecot-order-helpers";
import { buildLecotOrderLineRows } from "@/features/chatbot/chatbot-lecot-order-lines";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import { lecotShopBaseUrl } from "@/features/catalog/lecotShopConfig";
import type { SupplierOrderLine } from "@/features/suppliers/types";

export async function executeDemoLecotOrder(params: {
  ctx: ChatbotToolContext;
  input: Record<string, unknown>;
  orderRef: admin.firestore.DocumentReference;
  firestore: admin.firestore.Firestore;
  lines: SupplierOrderLine[];
  totalCents: number;
  notes: string | null;
  interventionId: string;
  linkMaterialOrder: boolean;
  orderClientName?: string;
}) {
  const {
    ctx,
    input,
    orderRef,
    firestore,
    lines,
    totalCents,
    notes,
    interventionId,
    linkMaterialOrder,
    orderClientName,
  } = params;

  const demoReference = buildLecotPreviewReference(orderRef.id);
  const demoNote = `Simulation démo CRMSLOT — ${demoReference}. Compte Lecot pro non connecté ; aucun envoi réel.`;
  await orderRef.update({
    status: "sent",
    isDemo: true,
    sentAt: new Date().toISOString(),
    notes: notes ? `${notes}\n${demoNote}` : demoNote,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  let materialOrderId: string | null = null;
  if (interventionId && linkMaterialOrder) {
    materialOrderId = await createLinkedMaterialOrder({
      firestore,
      interventionId,
      companyId: ctx.companyId,
      orderClientName,
      actorUid: ctx.actorUid,
      lines,
      supplierOrderId: orderRef.id,
      status: "ordered",
    });
  }

  const billingSynced = await syncOrderToInterventionBilling(
    ctx,
    input,
    interventionId,
    orderRef.id,
    lines,
    demoReference
  );

  await logLecotOrderPlacedCrm({
    ctx,
    supplierOrderId: orderRef.id,
    lines,
    totalCents,
    status: "sent",
    interventionId,
    materialOrderId,
    orderClientName,
    materialStatus: "ordered",
    demoMode: true,
  });

  const emailNote = await sendLecotOrderEmailAndMarkPending({
    orderId: orderRef.id,
    companyId: ctx.companyId,
    lines,
    totalCents,
    orderClientName,
    notes,
    reference: demoReference,
    orderRef,
  });

  const lineRows = buildLecotOrderLineRows(lines);
  const billingNote = billingSyncNote(billingSynced, interventionId, true);

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

export function isLecotDemoMode(): boolean {
  return lecotDemoOrdersEnabled();
}
