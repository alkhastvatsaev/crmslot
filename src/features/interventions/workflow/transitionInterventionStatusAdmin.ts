import type * as admin from "firebase-admin";
import type { Intervention } from "@/features/interventions/types";
import {
  actorMayTransition,
  assertTransitionAllowed,
  buildStatusTransitionPatch,
  statusChangeNotificationTargets,
} from "@/features/interventions/workflow/interventionWorkflow";
import type {
  InterventionStatusEvent,
  TransitionActor,
} from "@/features/interventions/workflow/interventionWorkflowTypes";

export type TransitionInterventionStatusAdminParams = {
  db: admin.firestore.Firestore;
  interventionId: string;
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "createdByUid" | "companyId">;
  toStatus: Intervention["status"];
  actor: TransitionActor;
  note?: string;
  extraPatch?: Record<string, unknown>;
  now?: Date;
  writeInboxAlerts?: boolean;
};

/**
 * Même logique que {@link transitionInterventionStatus} mais via Firebase Admin
 * (routes API — incompatible avec le SDK client `firebase/firestore`).
 */
export async function transitionInterventionStatusAdmin(
  params: TransitionInterventionStatusAdminParams
): Promise<InterventionStatusEvent> {
  const {
    db,
    interventionId,
    iv,
    toStatus,
    actor,
    note,
    extraPatch,
    now = new Date(),
    writeInboxAlerts = false,
  } = params;

  const fromStatus = iv.status;
  assertTransitionAllowed(fromStatus, toStatus);
  if (!actorMayTransition(actor, fromStatus, toStatus)) {
    throw new Error(`Acteur ${actor.role} non autorisé pour ${fromStatus} → ${toStatus}`);
  }

  const at = now.toISOString();
  const patch = buildStatusTransitionPatch({
    fromStatus,
    toStatus,
    iv,
    now,
    extraPatch,
  });

  const batch = db.batch();
  batch.update(db.collection("interventions").doc(interventionId), patch);

  const eventPayload: Omit<InterventionStatusEvent, "id"> = {
    interventionId,
    fromStatus,
    toStatus,
    actorUid: actor.uid,
    actorRole: actor.role,
    note: note ?? null,
    at,
    companyId: iv.companyId ?? null,
  };

  const eventRef = db
    .collection("interventions")
    .doc(interventionId)
    .collection("status_events")
    .doc();
  batch.set(eventRef, {
    interventionId: eventPayload.interventionId,
    fromStatus: eventPayload.fromStatus,
    toStatus: eventPayload.toStatus,
    actorUid: eventPayload.actorUid,
    actorRole: eventPayload.actorRole,
    note: eventPayload.note,
    at: eventPayload.at,
    companyId: eventPayload.companyId,
  });

  if (writeInboxAlerts) {
    const targets = statusChangeNotificationTargets(iv, toStatus, actor.uid);
    for (const targetUid of targets) {
      const alertRef = db
        .collection("users")
        .doc(targetUid)
        .collection("intervention_alerts")
        .doc();
      batch.set(alertRef, {
        interventionId,
        companyId: iv.companyId ?? null,
        fromStatus,
        toStatus,
        actorUid: actor.uid,
        read: false,
        at,
      });
    }
  }

  await batch.commit();

  const companyId = iv.companyId?.trim();
  if (companyId && fromStatus !== toStatus) {
    void import("@/features/integrations/server/dispatchCompanyWebhooksAdmin")
      .then(({ dispatchCompanyWebhooksAdmin }) =>
        dispatchCompanyWebhooksAdmin(companyId, "intervention.status_changed", {
          interventionId,
          at,
          data: { fromStatus, toStatus },
        })
      )
      .catch(() => {
        // Webhooks sortants ne doivent jamais bloquer la transition.
      });
  }

  if (fromStatus !== toStatus) {
    void import("@/features/interventions/server/portalStatusUpdateEmailAdmin")
      .then(({ sendPortalStatusUpdateEmailAdmin }) =>
        sendPortalStatusUpdateEmailAdmin({
          db,
          interventionId,
          iv,
          fromStatus,
          toStatus,
        })
      )
      .catch(() => {
        // E-mail portail client — best effort.
      });
  }

  return { id: eventRef.id, ...eventPayload };
}
