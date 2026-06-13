import * as adminNs from "firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";
import { logger } from "@/core/logger";

export async function rejectInterventionReportServer(params: {
  db: adminNs.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  decoded: DecodedIdToken;
  reason?: string;
}): Promise<void> {
  const { db, interventionId, actorUid, decoded, reason } = params;

  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) throw new Error("Intervention introuvable.");

  const iv = { id: snap.id, ...snap.data() } as Intervention;

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) throw new Error("companyId manquant.");

  const allowed = await assertCanAssignInterventionServer(db, actorUid, companyId, decoded);
  if (!allowed) throw new Error("Droits insuffisants pour refuser ce rapport.");

  if (iv.status !== "done") {
    throw new Error(`Statut invalide pour un refus : ${iv.status}`);
  }

  const rejectionReason = reason?.trim() || "";
  const note = rejectionReason
    ? `Rapport refusé par le back-office — ${rejectionReason}`
    : "Rapport refusé par le back-office — complément demandé au technicien";

  const rejectedAt = new Date().toISOString();

  await transitionInterventionStatusAdmin({
    db,
    interventionId,
    iv,
    toStatus: "in_progress",
    actor: dispatcherTransitionActor(actorUid),
    note,
    extraPatch: {
      reportRejectionReason: rejectionReason || note,
      reportRejectedAt: rejectedAt,
    },
    writeInboxAlerts: true,
  });

  // Fire-and-forget: notify technician by email
  const techUid = iv.assignedTechnicianUid?.trim();
  if (techUid) {
    try {
      const techUser = await adminNs.auth().getUser(techUid);
      const techEmail = techUser.email?.trim();
      if (techEmail) {
        const title = (iv.title || iv.problem || `Dossier #${interventionId.slice(-8)}`).trim();
        const displayReason = rejectionReason || "Complément demandé par le back-office";
        await sendInterventionEmail({
          interventionId,
          companyId,
          to: techEmail,
          subject: `Rapport refusé — veuillez compléter l'intervention ${title}`,
          bodyText: `Le back-office a refusé votre rapport.\n\nMotif : ${displayReason}\n\nMerci de rouvrir la mission et de compléter le rapport.`,
          bodyHtml: `<p>Le back-office a refusé votre rapport pour l'intervention <strong>${title}</strong>.</p><p><strong>Motif :</strong> ${displayReason}</p><p>Merci de rouvrir la mission et de compléter ou corriger le rapport avant de le soumettre à nouveau.</p>`,
          sentByUid: actorUid,
          sentVia: "reject-report",
          attachDocumentType: "none",
        });
      }
    } catch (err) {
      logger.warn("[rejectInterventionReport] Technician email failed (non-blocking):", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
