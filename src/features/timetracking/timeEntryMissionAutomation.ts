import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";
import type { TimeEntryType } from "@/features/timetracking/types";
import { TIME_ENTRY_LABELS, formatDuration } from "@/features/timetracking/types";

export function defaultTimeEntryTypeForStatus(status: Intervention["status"]): TimeEntryType {
  if (status === "in_progress" || status === "waiting_material") return "on_site";
  if (status === "en_route") return "travel";
  return "travel";
}

/** Démarre un chrono automatiquement selon le statut mission. */
export function autoStartTimeEntryType(
  status: Intervention["status"],
  hasActiveEntry: boolean
): TimeEntryType | null {
  if (hasActiveEntry) return null;
  if (status === "en_route") return "travel";
  if (status === "in_progress") return "on_site";
  return null;
}

/** Transition statut déclenchée au démarrage d'un pointage (mode auto). */
export function statusTransitionForTimeEntryStart(
  status: Intervention["status"],
  entryType: TimeEntryType
): Intervention["status"] | null {
  if (entryType !== "travel" && entryType !== "on_site") return null;
  if (entryType === "travel") {
    if (status === "assigned" || isInterventionPendingBackOfficeIntake({ status })) {
      return "en_route";
    }
    return null;
  }
  if (entryType === "on_site" && status === "en_route") return "in_progress";
  return null;
}

/** Fin déplacement → passage sur place. */
export function statusTransitionAfterTravelStop(
  status: Intervention["status"]
): Intervention["status"] | null {
  if (status === "en_route") return "in_progress";
  return null;
}

export function buildTimeEntryCrmNote(type: TimeEntryType, durationMinutes: number): string {
  const label = TIME_ENTRY_LABELS[type];
  return `Pointage ${label} — ${formatDuration(durationMinutes)}`;
}
