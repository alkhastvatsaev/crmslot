import type * as admin from "firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { Intervention } from "@/features/interventions/types";
import { prepareDraftBillingOnIntervention } from "@/features/interventions/server/prepareDraftBillingOnIntervention";
import { FieldValue } from "firebase-admin/firestore";
import { finalizeInterventionInvoiceAdmin } from "@/features/interventions/server/finalizeInterventionInvoiceAdmin";
import { sendInterventionInvoiceEmailToClient } from "@/features/interventions/server/interventionInvoiceEmail";
import { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";
import type { DecodedIdToken } from "firebase-admin/auth";

export type ValidateInterventionReportResult = {
  invoicePdfUrl: string;
  invoiceAmountCents: number;
  emailSent: boolean;
  emailError?: string;
};

export async function validateInterventionReportServer(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  decoded: DecodedIdToken;
  sendEmail?: boolean;
}): Promise<ValidateInterventionReportResult> {
  const { db, interventionId, actorUid, decoded } = params;
  const sendEmail = params.sendEmail !== false;

  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable.");
  }
  let iv = { id: snap.id, ...snap.data() } as Intervention;

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) {
    throw new Error("companyId manquant.");
  }
  const allowed = await assertCanAssignInterventionServer(db, actorUid, companyId, decoded);
  if (!allowed) {
    throw new Error("Droits insuffisants pour valider ce rapport.");
  }

  if (iv.status !== "done") {
    throw new Error(`Validation impossible : statut « ${iv.status} » (attendu : done).`);
  }

  await prepareDraftBillingOnIntervention(db, interventionId);
  const refreshed = await db.collection("interventions").doc(interventionId).get();
  iv = { id: refreshed.id, ...refreshed.data() } as Intervention;

  const invoicePatch = await finalizeInterventionInvoiceAdmin(iv, interventionId);

  const actor = dispatcherTransitionActor(actorUid);
  await transitionInterventionStatusAdmin({
    db,
    interventionId,
    iv,
    toStatus: "invoiced",
    actor,
    note: "Rapport validé — facture émise",
    extraPatch: {
      invoicePdfUrl: invoicePatch.invoicePdfUrl,
      invoicePdfStoragePath: invoicePatch.invoicePdfStoragePath,
      invoiceAmountCents: invoicePatch.invoiceAmountCents,
      invoicedAt: FieldValue.serverTimestamp(),
      paymentStatus: iv.paymentStatus === "paid" ? "paid" : "unpaid",
    },
    writeInboxAlerts: false,
  });

  let emailSent = false;
  let emailError: string | undefined;
  if (sendEmail) {
    const ivAfter = { ...iv, ...invoicePatch, status: "invoiced" as const };
    const mail = await sendInterventionInvoiceEmailToClient({
      interventionId,
      iv: ivAfter,
      sentByUid: actorUid,
    });
    emailSent = mail.ok;
    if (!mail.ok && !mail.skipped) {
      emailError = mail.error;
    }
  }

  return {
    invoicePdfUrl: invoicePatch.invoicePdfUrl,
    invoiceAmountCents: invoicePatch.invoiceAmountCents,
    emailSent,
    emailError,
  };
}
