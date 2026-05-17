import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians/types";

/** Complète `authUid` pour assignation Firestore (repli UID back-office / démo). */
export function withTechnicianAuthUid(technician: Technician): Technician {
  const authUid = (technician.authUid ?? "").trim();
  if (authUid) return technician;
  return { ...technician, authUid: getDefaultAssignedTechnicianUid() };
}
