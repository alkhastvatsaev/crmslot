import type * as admin from "firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { Intervention } from "@/features/interventions/types";
import { issueInterventionInvoiceAdmin } from "@/features/interventions/server/issueInterventionInvoiceAdmin";
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

  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable.");
  }
  const iv = { id: snap.id, ...snap.data() } as Intervention;

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) {
    throw new Error("companyId manquant.");
  }
  const allowed = await assertCanAssignInterventionServer(db, actorUid, companyId, decoded);
  if (!allowed) {
    throw new Error("Droits insuffisants pour valider ce rapport.");
  }

  const result = await issueInterventionInvoiceAdmin({
    db,
    interventionId,
    actorUid,
    sendEmail: params.sendEmail !== false,
    transitionNote: "Rapport validé — facture émise",
  });

  return {
    invoicePdfUrl: result.invoicePdfUrl,
    invoiceAmountCents: result.invoiceAmountCents,
    emailSent: result.emailSent,
    emailError: result.emailError,
  };
}
