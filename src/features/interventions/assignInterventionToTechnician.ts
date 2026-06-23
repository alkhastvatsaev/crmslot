import type { Intervention } from "@/features/interventions/types";
import { scheduledFieldsWhenReleasingToTechnician } from "@/features/interventions/technicianSchedule";

export type AssignInterventionToTechnicianUpdate = {
  status: "assigned";
  assignedTechnicianUid: string;
  scheduledDate: string;
  scheduledTime: string;
};

/** Patch Firestore quand le dispatch assigne un dossier au technicien (statut `assigned`). */
export type AssignScheduleOverride = Pick<
  AssignInterventionToTechnicianUpdate,
  "scheduledDate" | "scheduledTime"
>;

export function buildAssignInterventionToTechnicianUpdate(
  row:
    | Pick<Intervention, "requestedDate" | "requestedTime" | "scheduledDate" | "scheduledTime">
    | null
    | undefined,
  assignedTechnicianUid: string,
  now = new Date(),
  scheduleOverride?: AssignScheduleOverride
): AssignInterventionToTechnicianUpdate {
  const date = scheduleOverride?.scheduledDate?.trim();
  const time = scheduleOverride?.scheduledTime?.trim();
  if (date && time) {
    return {
      status: "assigned",
      assignedTechnicianUid,
      scheduledDate: date,
      scheduledTime: time,
    };
  }

  const schedule = scheduledFieldsWhenReleasingToTechnician(row ?? {}, now);
  return {
    status: "assigned",
    assignedTechnicianUid,
    scheduledDate: schedule.scheduledDate,
    scheduledTime: schedule.scheduledTime,
  };
}
