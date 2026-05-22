import type { Intervention } from "@/features/interventions/types";

/**
 * Données démo back-office (vide — plus de dossiers fictifs type « Flagey »).
 * Les missions assignées au technicien démo viennent de `generateDailyMissions` → `generateDailyAssignmentsAsInterventions`.
 */
export const DEMO_INTERVENTIONS: Intervention[] = [];

export function demoInterventionsForCompany(companyId: string): Intervention[] {
  const cid = companyId.trim();
  if (!cid) return [];
  return DEMO_INTERVENTIONS.filter((iv) => (iv.companyId ?? "").trim() === cid);
}
