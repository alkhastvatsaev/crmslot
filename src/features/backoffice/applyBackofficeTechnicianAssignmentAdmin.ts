import * as admin from "firebase-admin";
import type { AssignInterventionSchedule } from "@/features/backoffice/assignInterventionFromBackoffice";
import { resolveSmartAssignmentSchedule } from "@/features/scheduling/resolveSmartAssignmentSchedule";
import {
  buildBackofficeAssignPatch,
  canApplyBackofficeTechnicianAssignment,
} from "@/features/backoffice/applyBackofficeTechnicianAssignmentShared";
import type { Intervention } from "@/features/interventions";
import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";
import { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";

function clearTechnicianResponseFields(): Record<string, unknown> {
  return {
    technicianAcceptedAt: admin.firestore.FieldValue.delete(),
    technicianDeclinedAt: admin.firestore.FieldValue.delete(),
    technicianDeclinedByUid: admin.firestore.FieldValue.delete(),
  };
}

export async function applyBackofficeTechnicianAssignmentAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  iv: Intervention;
  technicianUid: string;
  actorUid: string;
  schedule?: AssignInterventionSchedule;
}): Promise<{
  scheduledDate: string;
  scheduledTime: string;
  rescheduled: boolean;
}> {
  const { db, interventionId, iv, technicianUid, actorUid, schedule } = params;
  if (!canApplyBackofficeTechnicianAssignment(iv)) {
    throw new Error("Ce dossier n'est pas assignable depuis l'onglet Demandes.");
  }

  const companyId = (iv.companyId ?? "").trim();
  const peerSnap = companyId
    ? await db.collection("interventions").where("companyId", "==", companyId).get()
    : null;
  const peerInterventions =
    peerSnap?.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Intervention) ?? [];

  const now = new Date();
  const resolved = resolveSmartAssignmentSchedule({
    iv,
    technicianUid,
    peerInterventions,
    scheduleOverride: schedule,
    now,
  });

  const actor = dispatcherTransitionActor(actorUid);
  const basePatch = buildBackofficeAssignPatch(iv, technicianUid, schedule, {
    peerInterventions,
    now,
  });

  if (isInterventionPendingBackOfficeIntake(iv)) {
    await transitionInterventionStatusAdmin({
      db,
      interventionId,
      iv,
      toStatus: "assigned",
      actor,
      extraPatch: basePatch,
      writeInboxAlerts: false,
    });
    return {
      scheduledDate: resolved.scheduledDate,
      scheduledTime: resolved.scheduledTime,
      rescheduled: resolved.rescheduled,
    };
  }

  await db
    .collection("interventions")
    .doc(interventionId)
    .update({
      ...basePatch,
      ...clearTechnicianResponseFields(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return {
    scheduledDate: resolved.scheduledDate,
    scheduledTime: resolved.scheduledTime,
    rescheduled: resolved.rescheduled,
  };
}
