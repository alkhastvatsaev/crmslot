import type { Technician } from "@/features/technicians";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";

/** UID Firebase Auth enregistré dans `assignedTechnicianUid` (jamais l’id doc Firestore). */
export function resolveTechnicianAssignUid(technician: Technician): string {
  const normalized = withTechnicianAuthUid(technician);
  const authUid = (normalized.authUid ?? "").trim();
  if (!authUid) {
    throw new Error(
      `Technicien « ${technician.name || technician.id} » sans authUid — lier le compte Firebase Auth avant assignation.`
    );
  }
  return authUid;
}

export function canResolveTechnicianAssignUid(technician: Technician): boolean {
  try {
    resolveTechnicianAssignUid(technician);
    return true;
  } catch {
    return false;
  }
}
