import { stripKnownSyntheticInterventions } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import { matchesAssignedTechnician } from "@/features/interventions/technicianAssignmentActions";
import { isInterventionReleasedToTechnicianField } from "@/features/interventions/technicianSchedule";

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
};

/**
 * Liste finale des missions technicien (Firestore uniquement, sans mocks journaliers).
 */
export function buildTechnicianInterventionList({
  firestoreInterventions,
  technicianUid,
}: BuildTechnicianInterventionListOptions): Intervention[] {
  return stripKnownSyntheticInterventions(
    filterInterventionsReleasedToTechnician(firestoreInterventions, technicianUid),
  );
}
