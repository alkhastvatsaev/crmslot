import type { ManualCommissionEntry } from "@/features/commissions";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";

const CLOSED_TERRAIN_PHOTO_STATUSES: Intervention["status"][] = ["done", "invoiced", "cancelled"];

/** Intervention active : le panneau droit bascule sur les photos terrain. */
export function interventionOpenForTerrainPhotos(iv: Intervention): boolean {
  return !CLOSED_TERRAIN_PHOTO_STATUSES.includes(iv.status);
}

function technicianAssignAliases(technicians: Technician[], technicianUid: string): Set<string> {
  const aliases = new Set<string>();
  const uid = technicianUid.trim();
  if (!uid) return aliases;
  aliases.add(uid);
  for (const tech of technicians) {
    const docId = tech.id.trim();
    const authUid = (tech.authUid ?? "").trim();
    if (authUid === uid) {
      aliases.add(docId);
      if (canResolveTechnicianAssignUid(tech)) {
        try {
          aliases.add(resolveTechnicianAssignUid(tech));
        } catch {
          // ignore
        }
      }
    }
    if (docId === uid && authUid) aliases.add(authUid);
  }
  return aliases;
}

export function filterInterventionsForTechnicianCommission(
  interventions: Intervention[],
  technicianUid: string | null,
  technicians: Technician[]
): Intervention[] {
  const uid = (technicianUid ?? "").trim();
  if (!uid) return [];
  const aliases = technicianAssignAliases(technicians, uid);
  return interventions.filter((iv) => aliases.has((iv.assignedTechnicianUid ?? "").trim()));
}

export function filterManualEntriesForTechnicianCommission(
  entries: ManualCommissionEntry[],
  technicianUid: string | null,
  technicians: Technician[]
): ManualCommissionEntry[] {
  const uid = (technicianUid ?? "").trim();
  if (!uid) return [];
  const aliases = technicianAssignAliases(technicians, uid);
  return entries.filter((entry) => aliases.has(entry.technicianUid.trim()));
}
