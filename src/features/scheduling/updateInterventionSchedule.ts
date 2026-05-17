import { doc, updateDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { Intervention } from "@/features/interventions/types";
import {
  candidateRangeFromScheduleFields,
  findTechnicianScheduleConflicts,
} from "@/features/scheduling/scheduleConflicts";

export type UpdateInterventionScheduleParams = {
  db: Firestore;
  intervention: Intervention;
  allInterventions: Intervention[];
  requestedDate?: string;
  requestedTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  /** Si true, écrit malgré le chevauchement (dispatch). */
  force?: boolean;
};

export type UpdateInterventionScheduleResult =
  | { ok: true }
  | { ok: false; reason: "no_schedule" | "conflict"; conflicts: ReturnType<typeof findTechnicianScheduleConflicts> };

export async function updateInterventionSchedule(
  params: UpdateInterventionScheduleParams,
): Promise<UpdateInterventionScheduleResult> {
  const {
    db,
    intervention,
    allInterventions,
    requestedDate,
    requestedTime,
    scheduledDate,
    scheduledTime,
    force = false,
  } = params;

  const patch: Record<string, string> = {};
  if (requestedDate !== undefined) patch.requestedDate = requestedDate;
  if (requestedTime !== undefined) patch.requestedTime = requestedTime;
  if (scheduledDate !== undefined) patch.scheduledDate = scheduledDate;
  if (scheduledTime !== undefined) patch.scheduledTime = scheduledTime;

  const dateForCheck = scheduledDate ?? requestedDate ?? intervention.scheduledDate ?? intervention.requestedDate ?? "";
  const timeForCheck = scheduledTime ?? requestedTime ?? intervention.scheduledTime ?? intervention.requestedTime ?? "";

  const techUid = (intervention.assignedTechnicianUid ?? "").trim();
  const candidateRange = candidateRangeFromScheduleFields(dateForCheck, timeForCheck);

  if (techUid && candidateRange && !force) {
    const conflicts = findTechnicianScheduleConflicts({
      interventions: allInterventions,
      technicianUid: techUid,
      candidateRange,
      excludeInterventionId: intervention.id,
    });
    if (conflicts.length > 0) {
      return { ok: false, reason: "conflict", conflicts };
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, reason: "no_schedule", conflicts: [] };
  }

  await updateDoc(doc(db, "interventions", intervention.id), patch);
  return { ok: true };
}
