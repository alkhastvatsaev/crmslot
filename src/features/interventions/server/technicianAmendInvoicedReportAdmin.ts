import type * as admin from "firebase-admin";
import { logCrmInterventionActionAdmin } from "@/features/crmHistory/logCrmInterventionActionAdmin";
import type { Intervention } from "@/features/interventions/types";

export async function technicianAmendInvoicedReportAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  patch: Record<string, unknown>;
}): Promise<void> {
  const { db, interventionId, actorUid, patch } = params;
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable.");
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const now = new Date().toISOString();

  await ref.update({
    ...patch,
    technicianReportAmendedAt: now,
    technicianReportAmendedByUid: actorUid,
    backofficeReportsArchivedAt: null,
    statusUpdatedAt: now,
  });

  await logCrmInterventionActionAdmin({
    kind: "intervention_terrain_report_received",
    iv,
    actorUid,
    actorRole: "technician",
    note: "Rapport modifié par le technicien après clôture (facturé)",
  });
}
