import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import type { AssignInterventionSchedule } from "@/features/backoffice/assignInterventionFromBackoffice";
import type { Intervention } from "@/features/interventions";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";
import { resolveSmartAssignmentSchedule } from "@/features/scheduling/resolveSmartAssignmentSchedule";

export function buildBackofficeAssignPatch(
  iv: Intervention,
  technicianUid: string,
  schedule?: AssignInterventionSchedule,
  opts?: {
    peerInterventions?: Intervention[];
    now?: Date;
    resolvedSchedule?: { scheduledDate: string; scheduledTime: string };
  }
) {
  if (opts?.resolvedSchedule) {
    return buildAssignInterventionToTechnicianUpdate(iv, technicianUid, opts.now ?? new Date(), {
      scheduledDate: opts.resolvedSchedule.scheduledDate,
      scheduledTime: opts.resolvedSchedule.scheduledTime,
    });
  }
  if (opts?.peerInterventions) {
    const resolved = resolveSmartAssignmentSchedule({
      iv,
      technicianUid,
      peerInterventions: opts.peerInterventions,
      scheduleOverride: schedule,
      now: opts.now,
    });
    return buildAssignInterventionToTechnicianUpdate(iv, technicianUid, opts.now ?? new Date(), {
      scheduledDate: resolved.scheduledDate,
      scheduledTime: resolved.scheduledTime,
    });
  }
  return buildAssignInterventionToTechnicianUpdate(iv, technicianUid, new Date(), schedule);
}

/** Réassignation depuis Demandes (déjà `assigned` / legacy sans acceptation). */
export function canApplyBackofficeTechnicianAssignment(
  iv: Pick<Intervention, "status" | "technicianAcceptedAt">
): boolean {
  return (
    isInterventionPendingBackOfficeIntake(iv) || isInterventionAwaitingTechnicianAcceptance(iv)
  );
}
