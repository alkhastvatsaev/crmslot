import * as admin from "firebase-admin";
import { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";
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

export async function executeProductionLecotOrder(params: {
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

  const materialStatus: "ordered" | "pending" =
    lecot.ok && (lecot.source === "api" || lecot.source === "playwright") ? "ordered" : "pending";

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
      status: materialStatus,
    });
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

  await logLecotOrderPlacedCrm({
    ctx,
    supplierOrderId: orderRef.id,
    lines,
    totalCents,
    status,
    interventionId,
    materialOrderId,
    orderClientName,
    materialStatus,
  });

  const emailNote = await sendLecotOrderEmailAndMarkPending({
    orderId: orderRef.id,
    companyId: ctx.companyId,
    lines,
    totalCents,
    orderClientName,
    notes,
    reference: lecotRef,
    orderRef,
  });

  const lineRows = buildLecotOrderLineRows(lines);
  const manualFinalize =
    lecot.ok && lecot.source === "manual"
      ? " Finalisez sur lecot.be via les liens lecotSearchUrl."
      : "";
  const billingNote = billingSyncNote(billingSynced, interventionId);

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
