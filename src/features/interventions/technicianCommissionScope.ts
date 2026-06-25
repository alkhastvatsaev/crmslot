import type { ManualCommissionEntry } from "@/features/commissions";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians";
import {
  findTechnicianByAssignUid,
  resolveTechnicianAuthUid,
} from "@/features/technicians/resolveTechnicianIdentity";

const CLOSED_TERRAIN_PHOTO_STATUSES: Intervention["status"][] = ["done", "invoiced", "cancelled"];

/** Intervention active : le panneau droit bascule sur les photos terrain. */
export function interventionOpenForTerrainPhotos(iv: Intervention): boolean {
  return !CLOSED_TERRAIN_PHOTO_STATUSES.includes(iv.status);
}

function technicianAssignAliases(
  technicians: Technician[],
  technicianUid: string,
  email?: string
): Set<string> {
  const aliases = new Set<string>();
  const uid = technicianUid.trim();
  if (!uid) return aliases;
  aliases.add(uid);

  const tech = findTechnicianByAssignUid(technicians, uid, { email });
  if (!tech) return aliases;

  const docId = tech.id.trim();
  const authUid = resolveTechnicianAuthUid(tech);
  if (docId) aliases.add(docId);
  if (authUid) aliases.add(authUid);
  return aliases;
}

export function filterInterventionsForTechnicianCommission(
  interventions: Intervention[],
  technicianUid: string | null,
  technicians: Technician[],
  email?: string
): Intervention[] {
  const uid = (technicianUid ?? "").trim();
  if (!uid) return [];
  const aliases = technicianAssignAliases(technicians, uid, email);
  return interventions.filter((iv) => aliases.has((iv.assignedTechnicianUid ?? "").trim()));
}

export function filterManualEntriesForTechnicianCommission(
  entries: ManualCommissionEntry[],
  technicianUid: string | null,
  technicians: Technician[],
  email?: string
): ManualCommissionEntry[] {
  const uid = (technicianUid ?? "").trim();
  if (!uid) return [];
  const aliases = technicianAssignAliases(technicians, uid, email);
  return entries.filter((entry) => aliases.has(entry.technicianUid.trim()));
}
