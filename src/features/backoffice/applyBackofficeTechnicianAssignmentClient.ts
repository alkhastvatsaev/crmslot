import { deleteField, doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import type { AssignInterventionSchedule } from "@/features/backoffice/assignInterventionFromBackoffice";
import {
  buildBackofficeAssignPatch,
  canApplyBackofficeTechnicianAssignment,
} from "@/features/backoffice/applyBackofficeTechnicianAssignmentShared";
import type { Intervention } from "@/features/interventions";
import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { dispatcherTransitionActor } from "@/features/interventions/workflow/workflowActor";

function clearTechnicianResponseFields(): Record<string, unknown> {
  return {
    technicianAcceptedAt: deleteField(),
    technicianDeclinedAt: deleteField(),
    technicianDeclinedByUid: deleteField(),
  };
}

export async function applyBackofficeTechnicianAssignmentClient(
  interventionId: string,
  iv: Intervention,
  technicianUid: string,
  actorUid: string,
  schedule?: AssignInterventionSchedule
): Promise<void> {
  if (!firestore) throw new Error("Firestore indisponible");
  if (!canApplyBackofficeTechnicianAssignment(iv)) {
    throw new Error("Ce dossier n'est pas assignable depuis l'onglet Demandes.");
  }

  const actor = dispatcherTransitionActor(actorUid);
  const basePatch = buildBackofficeAssignPatch(iv, technicianUid, schedule);

  if (isInterventionPendingBackOfficeIntake(iv)) {
    await transitionInterventionStatus({
      db: firestore,
      interventionId,
      iv,
      toStatus: "assigned",
      actor,
      extraPatch: basePatch,
      writeInboxAlerts: false,
    });
    return;
  }

  await updateDoc(doc(firestore, "interventions", interventionId), {
    ...basePatch,
    ...clearTechnicianResponseFields(),
  });

  await logCrmInterventionAction({
    kind: "intervention_assigned",
    iv: { ...iv, assignedTechnicianUid: technicianUid, status: iv.status },
    actorUid,
    actorRole: "dispatcher",
    statusAfter: "assigned",
    note: schedule ? `Créneau ${schedule.scheduledDate} ${schedule.scheduledTime}` : undefined,
  });
}
