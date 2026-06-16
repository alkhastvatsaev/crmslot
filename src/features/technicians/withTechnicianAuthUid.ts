import type { Technician } from "@/features/technicians/types";

/** Retourne le technicien tel quel — `authUid` doit être renseigné en base. */
export function withTechnicianAuthUid(technician: Technician): Technician {
  return technician;
}
