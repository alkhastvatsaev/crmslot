import * as admin from "firebase-admin";
import { logger } from "@/core/logger";
import { registerSupplierOrderInIntervention } from "@/features/chatbot/chatbot-order-sync";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import { LECOT_EMAIL, sendLecotOrderEmail } from "@/features/chatbot/sendLecotOrderEmail";
import {
  logCrmMaterialOrderPlacedAdmin,
  logCrmSupplierOrderPlacedAdmin,
} from "@/features/crmHistory/logCrmSupplierAndMaterialOrder";
import { resolveInterventionClientNameFromRecord } from "@/features/interventions/resolveInterventionClientName";
import { requireMaterialOrderClientName } from "@/features/materials/materialOrderClientName";
import type { SupplierOrderLine } from "@/features/suppliers";

export async function assertInterventionAccess(companyId: string, interventionId: string) {
  const ref = admin.firestore().collection("interventions").doc(interventionId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé à ce dossier (autre société)");
  }
  return doc.data()!;
}

export async function syncOrderToInterventionBilling(
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

export async function resolveLecotOrderClientName(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>,
  interventionId: string
): Promise<string | undefined> {
  const explicitClient = typeof input.clientName === "string" ? input.clientName.trim() : "";
  if (explicitClient) {
    return requireMaterialOrderClientName(explicitClient);
  }
  if (interventionId) {
    const ivData = await assertInterventionAccess(ctx.companyId, interventionId);
    return requireMaterialOrderClientName(resolveInterventionClientNameFromRecord(ivData));
  }
  if (ctx.requireMaterialOrderClientName) {
    return requireMaterialOrderClientName("");
  }
  return undefined;
}

export async function createSupplierOrderDraft(params: {
  companyId: string;
  actorUid: string;
  lines: SupplierOrderLine[];
  totalCents: number;
  notes: string | null;
  interventionId: string;
  orderClientName?: string;
}) {
  const firestore = admin.firestore();
  const orderRef = await firestore
    .collection("companies")
    .doc(params.companyId)
    .collection("supplierOrders")
    .add({
      companyId: params.companyId,
      supplierId: "lecot",
      supplierName: "Lecot",
      status: "draft",
      lines: params.lines,
      totalCents: params.totalCents,
      deliveryDate: null,
      notes: params.notes,
      createdByUid: params.actorUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAt: null,
      deliveredAt: null,
      ...(params.interventionId ? { interventionId: params.interventionId } : {}),
      ...(params.orderClientName
        ? { clientName: params.orderClientName, nom: params.orderClientName }
        : {}),
    });
  return { firestore, orderRef };
}

export async function createLinkedMaterialOrder(params: {
  firestore: admin.firestore.Firestore;
  interventionId: string;
  companyId: string;
  orderClientName?: string;
  actorUid: string;
  lines: SupplierOrderLine[];
  supplierOrderId: string;
  status: "ordered" | "pending";
}): Promise<string> {
  const now = new Date().toISOString();
  const materialRef = await params.firestore.collection("material_orders").add({
    interventionId: params.interventionId,
    companyId: params.companyId,
    clientName: params.orderClientName,
    technicianUid: params.actorUid,
    partsRequested: params.lines.map((l) => ({
      description: l.label,
      quantity: l.quantity,
      reference: l.sku,
    })),
    urgency: "normal",
    status: params.status,
    supplierOrderId: params.supplierOrderId,
    createdAt: now,
    updatedAt: now,
  });
  return materialRef.id;
}

export async function logLecotOrderPlacedCrm(params: {
  ctx: ChatbotToolContext;
  supplierOrderId: string;
  lines: SupplierOrderLine[];
  totalCents: number;
  status: "draft" | "sent";
  interventionId: string;
  materialOrderId: string | null;
  orderClientName?: string;
  materialStatus: "ordered" | "pending";
  demoMode?: boolean;
}) {
  await logCrmSupplierOrderPlacedAdmin({
    ctx: params.ctx,
    supplierOrderId: params.supplierOrderId,
    lines: params.lines,
    totalCents: params.totalCents,
    status: params.status,
    interventionId: params.interventionId || null,
    materialOrderId: params.materialOrderId,
    clientName: params.orderClientName ?? null,
    demoMode: params.demoMode,
  });
  if (params.materialOrderId && params.interventionId) {
    await logCrmMaterialOrderPlacedAdmin({
      ctx: params.ctx,
      materialOrderId: params.materialOrderId,
      interventionId: params.interventionId,
      partsSummary: params.lines.map((l) => `${l.quantity}× ${l.label}`).join(", "),
      status: params.materialStatus,
      clientName: params.orderClientName ?? null,
      supplierOrderId: params.supplierOrderId,
    });
  }
}

export async function sendLecotOrderEmailAndMarkPending(params: {
  orderId: string;
  companyId: string;
  lines: SupplierOrderLine[];
  totalCents: number;
  orderClientName?: string;
  notes: string | null;
  reference: string | null;
  orderRef: admin.firestore.DocumentReference;
}): Promise<string> {
  const emailResult = await sendLecotOrderEmail({
    orderId: params.orderId,
    companyId: params.companyId,
    lines: params.lines,
    totalCents: params.totalCents,
    clientName: params.orderClientName ?? null,
    notes: params.notes,
    reference: params.reference,
  });
  if (!emailResult.ok && emailResult.error?.includes("Gmail OAuth non configuré")) {
    await params.orderRef.update({
      emailPending: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  return emailResult.ok
    ? ` Email bon de commande envoyé à ${LECOT_EMAIL}.`
    : emailResult.error
      ? ` (Email non envoyé : ${emailResult.error})`
      : "";
}

export function billingSyncNote(
  billingSynced: boolean,
  interventionId: string,
  demoMode?: boolean
): string {
  if (billingSynced) {
    return demoMode
      ? " Lignes ajoutées à la facture du dossier ; PDF bon de commande et facture à droite."
      : " Lignes sur la facture dossier ; bons de commande et facture ouverts à droite.";
  }
  return interventionId
    ? " ⚠ Sync facturation échouée — vérifiez manuellement les lignes sur le dossier."
    : "";
}
