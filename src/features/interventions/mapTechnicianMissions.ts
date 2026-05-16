import type { Intervention } from "@/features/interventions/types";
import {
  interventionMatchesTab,
  isInterventionReleasedToTechnicianField,
  type TechnicianTabFilter,
} from "@/features/interventions/technicianSchedule";

/** Interventions affichables sur la carte hub (libérées IVANA + onglet date + géoloc valide). */
export function filterInterventionsForMapTechnicianMissions(
  rows: Intervention[],
  tab: TechnicianTabFilter,
  anchorDate: Date,
): Intervention[] {
  return rows
    .filter((iv) => isInterventionReleasedToTechnicianField(iv))
    .filter((iv) => interventionMatchesTab(iv, tab, anchorDate))
    .filter(
      (iv) =>
        iv.location != null &&
        typeof iv.location.lat === "number" &&
        typeof iv.location.lng === "number",
    );
}
