import { collection, doc, type Firestore, writeBatch, type WriteBatch } from "firebase/firestore";
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
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { dispatchStatusNotifications } from "@/features/notifications/dispatchStatusNotifications";
import {
  loadClientNotificationPreferences,
  loadStaffNotificationPreferences,
} from "@/features/notifications/loadNotificationPreferences";

export type TransitionInterventionStatusParams = {
  db: Firestore;
  interventionId: string;
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "createdByUid" | "companyId">;
  toStatus: Intervention["status"];
  actor: TransitionActor;
  note?: string;
  extraPatch?: Record<string, unknown>;
  now?: Date;
  /** Si false, n’écrit pas les alertes inbox (tests / offline). */
  writeInboxAlerts?: boolean;
  /** Données intervention complètes pour les notifications email (optionnel). */
  interventionSnapshot?: Pick<
    Intervention,
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientPhone"
    | "address"
    | "title"
    | "scheduledDate"
    | "scheduledTime"
  >;
  /** Nom du technicien assigné (affiché dans les emails). */
  technicianName?: string;
};

function appendStatusEventToBatch(
  batch: WriteBatch,
  db: Firestore,
  event: Omit<InterventionStatusEvent, "id">
): string {
  const eventRef = doc(collection(db, "interventions", event.interventionId, "status_events"));
  batch.set(eventRef, {
    interventionId: event.interventionId,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    actorUid: event.actorUid,
    actorRole: event.actorRole,
    note: event.note ?? null,
    at: event.at,
    companyId: event.companyId ?? null,
  });
  return eventRef.id;
}

function appendInboxAlertsToBatch(
  batch: WriteBatch,
  db: Firestore,
  params: {
    interventionId: string;
    companyId: string | null;
    fromStatus: Intervention["status"];
    toStatus: Intervention["status"];
    actorUid: string;
    targets: string[];
    at: string;
  }
): void {
  for (const targetUid of params.targets) {
    const alertRef = doc(collection(db, "users", targetUid, "intervention_alerts"));
    batch.set(alertRef, {
      interventionId: params.interventionId,
      companyId: params.companyId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      actorUid: params.actorUid,
      read: false,
      at: params.at,
    });
  }
}

/**
 * Met à jour le statut, le responsable courant, journalise l’événement et notifie les parties prenantes.
 */
export async function transitionInterventionStatus(
  params: TransitionInterventionStatusParams
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
    writeInboxAlerts = true,
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

  const batch = writeBatch(db);
  batch.update(doc(db, "interventions", interventionId), patch);

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

  const eventId = appendStatusEventToBatch(batch, db, eventPayload);

  if (writeInboxAlerts) {
    const targets = statusChangeNotificationTargets(iv, toStatus, actor.uid);
    if (targets.length > 0) {
      appendInboxAlertsToBatch(batch, db, {
        interventionId,
        companyId: iv.companyId ?? null,
        fromStatus,
        toStatus,
        actorUid: actor.uid,
        targets,
        at,
      });
    }
  }

  await batch.commit();

  const companyId = iv.companyId?.trim();
  if (companyId && fromStatus !== toStatus) {
    void fetchWithAuth(
      `/api/interventions/${encodeURIComponent(interventionId)}/dispatch-status-webhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStatus, toStatus, at }),
      }
    ).catch(() => {
      // Webhooks sortants ne doivent jamais bloquer la transition.
    });
  }

  // Fire-and-forget email/SMS notifications (never blocks the workflow)
  const notificationSnapshot = params.interventionSnapshot;
  if (writeInboxAlerts && notificationSnapshot) {
    void (async () => {
      let clientPreferences = null;
      let technicianPreferences = null;
      let dispatcherPreferences = null;
      const clientUid = iv.createdByUid?.trim();
      const techUid = iv.assignedTechnicianUid?.trim();
      if (clientUid) {
        try {
          clientPreferences = await loadClientNotificationPreferences(db, clientUid);
        } catch {
          // Préférences absentes → comportement historique (tout activé).
        }
      }
      if (techUid) {
        try {
          technicianPreferences = await loadStaffNotificationPreferences(db, techUid);
        } catch {
          // idem
        }
      }
      if (actor.uid?.trim()) {
        try {
          dispatcherPreferences = await loadStaffNotificationPreferences(db, actor.uid.trim());
        } catch {
          // idem
        }
      }
      const snapshot = notificationSnapshot;
      await dispatchStatusNotifications({
        fromStatus,
        toStatus,
        intervention: {
          id: interventionId,
          title: snapshot.title ?? "",
          address: snapshot.address ?? "",
          clientName: snapshot.clientName,
          clientFirstName: snapshot.clientFirstName,
          clientLastName: snapshot.clientLastName,
          clientPhone: snapshot.clientPhone,
          scheduledDate: snapshot.scheduledDate,
          scheduledTime: snapshot.scheduledTime,
        },
        technicianName: params.technicianName,
        clientPreferences,
        technicianPreferences,
        dispatcherPreferences,
      });
    })();
  }

  return { id: eventId, ...eventPayload };
}
