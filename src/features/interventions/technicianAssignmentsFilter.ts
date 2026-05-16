import {
  realInterventionsOnly,
  stripKnownSyntheticInterventions,
} from "@/core/config/devUiPreview";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Intervention } from "@/features/interventions/types";
import { matchesAssignedTechnician } from "@/features/interventions/technicianAssignmentActions";
import { isInterventionReleasedToTechnicianField } from "@/features/interventions/technicianSchedule";
import { generateDailyAssignmentsAsInterventions } from "@/utils/dailyMockAssignments";

/** Dossiers visibles par le technicien après le goulot IVANA + correspondance UID. */
export function filterInterventionsReleasedToTechnician(
  rows: Intervention[],
  technicianUid: string | null | undefined,
): Intervention[] {
  const uid = (technicianUid ?? "").trim();
  if (!uid) return [];
  return rows.filter((iv) => {
    if (!isInterventionReleasedToTechnicianField(iv)) return false;
    return matchesAssignedTechnician(iv, uid);
  });
}

export type BuildTechnicianInterventionListOptions = {
  firestoreInterventions: Intervention[];
  technicianUid: string | null | undefined;
  dashboardDate: Date;
  /** `devUiPreviewEnabled` && technicien = UID démo par défaut */
  devUiPreviewWithDemos: boolean;
};

/**
 * Liste finale des missions technicien (Firestore + mocks journaliers en dev).
 * Logique extraite de `useTechnicianAssignments` pour tests unitaires sans Firestore.
 */
export function buildTechnicianInterventionList({
  firestoreInterventions,
  technicianUid,
  dashboardDate,
  devUiPreviewWithDemos,
}: BuildTechnicianInterventionListOptions): Intervention[] {
  const defaultTechUid = getDefaultAssignedTechnicianUid();
  if (devUiPreviewWithDemos && technicianUid === defaultTechUid && !realInterventionsOnly) {
    const mockRows = generateDailyAssignmentsAsInterventions(dashboardDate);
    const map = new Map(mockRows.map((r) => [r.id, r]));
    firestoreInterventions.forEach((r) => map.set(r.id, r));
    return filterInterventionsReleasedToTechnician(Array.from(map.values()), technicianUid);
  }
  return stripKnownSyntheticInterventions(
    filterInterventionsReleasedToTechnician(firestoreInterventions, technicianUid),
  );
}
