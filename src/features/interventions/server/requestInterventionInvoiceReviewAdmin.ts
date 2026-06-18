import type * as admin from "firebase-admin";
import { logCrmInterventionActionAdmin } from "@/features/crmHistory/logCrmInterventionActionAdmin";
import type { Intervention } from "@/features/interventions/types";

export type RequestInterventionInvoiceReviewResult = {
  ok: true;
};

export async function requestInterventionInvoiceReviewAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  note: string;
}): Promise<RequestInterventionInvoiceReviewResult> {
  const { db, interventionId, actorUid } = params;
  const note = params.note.trim();

  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable.");
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  if (iv.status !== "done") {
    throw new Error("La facture ne peut être transmise au back-office qu'après clôture terrain.");
  }

  const now = new Date().toISOString();
  await ref.update({
    invoiceReviewRequestedAt: now,
    invoiceReviewRequestedByUid: actorUid,
    invoiceReviewNote: note || null,
  });

  await logCrmInterventionActionAdmin({
    kind: "intervention_billing_updated",
    iv,
    actorUid,
    actorRole: "technician",
    note: note
      ? `Facture à valider par le back-office — note technicien : ${note}`
      : "Facture à valider par le back-office (technicien)",
  });

  return { ok: true };
}
