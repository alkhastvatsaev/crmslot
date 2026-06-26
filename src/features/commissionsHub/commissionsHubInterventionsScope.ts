import type { Intervention } from "@/features/interventions";
import type { Technician } from "@/features/technicians";
import {
  findTechnicianByAssignUid,
  resolveTechnicianAuthUid,
} from "@/features/technicians/resolveTechnicianIdentity";

/** UID Firestore utilisés dans `assignedTechnicianUid` pour les techniciens d'une société. */
export function collectCompanyTechnicianAssignUids(technicians: Technician[]): string[] {
  const uids = new Set<string>();
  for (const tech of technicians) {
    const docId = tech.id.trim();
    const authUid = resolveTechnicianAuthUid(tech);
    if (docId) uids.add(docId);
    if (authUid) uids.add(authUid);
  }
  return [...uids];
}

/**
 * Inclut une intervention dans les agrégats commissions patron si elle appartient à la société
 * ou si elle est assignée à un technicien de la société (ex. `companyId` manquant côté terrain).
 */
export function interventionCountsForCompanyCommissions(
  companyId: string,
  iv: Intervention,
  technicians: Technician[]
): boolean {
  const cid = companyId.trim();
  if (!cid) return false;
  const rowCompanyId = (iv.companyId ?? "").trim();
  if (rowCompanyId === cid) return true;
  const assigned = (iv.assignedTechnicianUid ?? "").trim();
  if (!assigned) return false;
  return findTechnicianByAssignUid(technicians, assigned) != null;
}

/** Union requête société + missions assignées aux techniciens (hors filtre `companyId`). */
export function mergeCommissionsHubInterventions(
  companyId: string,
  companyInterventions: Intervention[],
  assignedInterventions: Intervention[],
  technicians: Technician[]
): Intervention[] {
  const byId = new Map(companyInterventions.map((iv) => [iv.id, iv]));
  for (const iv of assignedInterventions) {
    if (byId.has(iv.id)) continue;
    if (interventionCountsForCompanyCommissions(companyId, iv, technicians)) {
      byId.set(iv.id, iv);
    }
  }
  return [...byId.values()];
}
