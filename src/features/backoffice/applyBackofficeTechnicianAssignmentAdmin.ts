import * as admin from "firebase-admin";
import type { AssignInterventionSchedule } from "@/features/backoffice/assignInterventionFromBackoffice";
import { resolveSmartAssignmentSchedule } from "@/features/scheduling/resolveSmartAssignmentSchedule";
import {
  candidateRangeFromScheduleFields,
  findTechnicianScheduleConflicts,
} from "@/features/scheduling/scheduleConflicts";
import {
  buildBackofficeAssignPatch,
  canApplyBackofficeTechnicianAssignment,
} from "@/features/backoffice/applyBackofficeTechnicianAssignmentShared";
import type { Intervention } from "@/features/interventions";
import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";
import { notifyTechnicianAssignmentAdmin } from "@/features/interventions/server/notifyTechnicianAssignmentAdmin";
import { notifyTechnicianUnassignmentAdmin } from "@/features/interventions/server/notifyTechnicianUnassignmentAdmin";
import { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { logger } from "@/core/logger";

function clearTechnicianResponseFields(): Record<string, unknown> {
  return {
    technicianAcceptedAt: admin.firestore.FieldValue.delete(),
    technicianDeclinedAt: admin.firestore.FieldValue.delete(),
    technicianDeclinedByUid: admin.firestore.FieldValue.delete(),
  };
}

/**
 * Résout les alias UID d'un technicien (doc ID Firestore ↔ authUid).
 * Permet de détecter les conflits sur des interventions stockées avec l'un ou l'autre.
 */
async function resolveTechnicianUidAliases(
  db: admin.firestore.Firestore,
  authUid: string
): Promise<string[]> {
  const trimmed = authUid.trim();
  if (!trimmed) return [];
  const aliases: string[] = [];
  try {
    const snap = await db.collection("technicians").where("authUid", "==", trimmed).limit(5).get();
    for (const doc of snap.docs) {
      const docId = doc.id.trim();
      if (docId && docId !== trimmed) aliases.push(docId);
    }
    const directSnap = await db.collection("technicians").doc(trimmed).get();
    if (directSnap.exists) {
      const docAuthUid = (
        ((directSnap.data() as Record<string, unknown>)?.authUid as string) ?? ""
      ).trim();
      if (docAuthUid && docAuthUid !== trimmed) aliases.push(docAuthUid);
    }
  } catch {
    // non critique
  }
  return [...new Set(aliases)];
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
    serverTz: true,
  });

  const technicianUidAliases = await resolveTechnicianUidAliases(db, technicianUid);

  const candidateRange = candidateRangeFromScheduleFields(
    resolved.scheduledDate,
    resolved.scheduledTime
  );
  if (candidateRange) {
    const conflicts = findTechnicianScheduleConflicts({
      interventions: peerInterventions,
      technicianUid,
      candidateRange,
      excludeInterventionId: interventionId,
      technicianUidAliases,
    });
    if (conflicts.length > 0) {
      throw new Error("Ce créneau chevauche une autre mission du technicien.");
    }
  }

  const actor = dispatcherTransitionActor(actorUid);
  const basePatch = buildBackofficeAssignPatch(iv, technicianUid, schedule, {
    resolvedSchedule: {
      scheduledDate: resolved.scheduledDate,
      scheduledTime: resolved.scheduledTime,
    },
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
  } else {
    await db
      .collection("interventions")
      .doc(interventionId)
      .update({
        ...basePatch,
        ...clearTechnicianResponseFields(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  const previousUid = (iv.assignedTechnicianUid ?? "").trim();
  const nextUid = technicianUid.trim();

  if (previousUid && previousUid !== nextUid) {
    try {
      await notifyTechnicianUnassignmentAdmin({
        db,
        technicianUid: previousUid,
        interventionId,
        iv,
      });
    } catch (err) {
      logger.warn("[applyBackofficeTechnicianAssignmentAdmin] unassign push failed", {
        interventionId,
        technicianUid: previousUid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (nextUid && previousUid !== nextUid) {
    try {
      const push = await notifyTechnicianAssignmentAdmin({
        db,
        technicianUid: nextUid,
        interventionId,
        iv,
      });
      if (push.sent === 0) {
        logger.warn("[applyBackofficeTechnicianAssignmentAdmin] 0 push technicien", {
          interventionId,
          technicianUid: nextUid,
        });
      }
    } catch (err) {
      logger.warn("[applyBackofficeTechnicianAssignmentAdmin] push notify failed", {
        interventionId,
        technicianUid: nextUid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    scheduledDate: resolved.scheduledDate,
    scheduledTime: resolved.scheduledTime,
    rescheduled: resolved.rescheduled,
  };
}
