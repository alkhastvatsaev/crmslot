import type { Technician } from "@/features/technicians/types";
import { withTechnicianAuthUid } from "@/features/technicians/withTechnicianAuthUid";

/** UID Firebase enregistré dans `assignedTechnicianUid`. */
export function resolveTechnicianAssignUid(technician: Technician): string {
  const normalized = withTechnicianAuthUid(technician);
  const authUid = (normalized.authUid ?? "").trim();
  if (authUid) return authUid;
  const id = (technician.id ?? "").trim();
  if (id.length >= 20) return id;
  return (normalized.authUid ?? "").trim();
}
