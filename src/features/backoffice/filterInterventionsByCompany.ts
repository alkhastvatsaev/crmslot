import type { Intervention } from "@/features/interventions/types";

/** Garde-fou client si Firestore renvoie des docs hors société active (rules permissives en dev). */
export function filterInterventionsByCompany(
  companyId: string,
  rows: Intervention[],
): Intervention[] {
  const cid = companyId.trim();
  if (!cid) return [];
  return rows.filter((row) => (row.companyId ?? "").trim() === cid);
}
