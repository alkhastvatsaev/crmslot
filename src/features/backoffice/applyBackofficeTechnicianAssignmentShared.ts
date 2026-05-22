import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import type { AssignInterventionSchedule } from "@/features/backoffice/assignInterventionFromBackoffice";
import type { Intervention } from "@/features/interventions/types";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";

export function buildBackofficeAssignPatch(
  iv: Intervention,
  technicianUid: string,
  schedule?: AssignInterventionSchedule,
) {
  return buildAssignInterventionToTechnicianUpdate(iv, technicianUid, new Date(), schedule);
}

/** Réassignation depuis Demandes (déjà `assigned` / legacy sans acceptation). */
export function canApplyBackofficeTechnicianAssignment(
  iv: Pick<Intervention, "status" | "technicianAcceptedAt">,
): boolean {
  return (
    isInterventionPendingBackOfficeIntake(iv) ||
    isInterventionAwaitingTechnicianAcceptance(iv)
  );
}
