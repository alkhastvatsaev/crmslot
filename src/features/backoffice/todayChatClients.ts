import type { Intervention } from "@/features/interventions/types";
import {
  interventionMatchesTab,
  isInterventionReleasedToTechnicianField,
  sortInterventionsByScheduleAsc,
} from "@/features/interventions/technicianSchedule";

/** Même périmètre que le rail gauche carte (missions du jour). */
export function filterTodayChatClients(
  interventions: Intervention[],
  anchorDate: Date,
  options?: { dispatchMap?: boolean },
): Intervention[] {
  const dispatchMap = options?.dispatchMap ?? false;
  const rows = interventions.filter((iv) => {
    if (!interventionMatchesTab(iv, "today", anchorDate)) return false;
    if (dispatchMap && !isInterventionReleasedToTechnicianField(iv)) return false;
    if (iv.status === "cancelled") return false;
    return true;
  });
  return sortInterventionsByScheduleAsc(rows);
}
