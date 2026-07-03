import type { Technician } from "@/features/technicians/types";

/** Normalise `authUid` — repli sur l’id doc quand le profil legacy n’a pas le champ. */
export function withTechnicianAuthUid(technician: Technician): Technician {
  const authUid = (technician.authUid ?? "").trim() || technician.id.trim();
  if (!authUid || authUid === (technician.authUid ?? "").trim()) return technician;
  return { ...technician, authUid };
}
