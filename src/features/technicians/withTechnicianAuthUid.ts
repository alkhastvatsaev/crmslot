import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians/types";

/** Complète `authUid` en démo uniquement — jamais sans UID Auth lié en prod. */
export function withTechnicianAuthUid(technician: Technician): Technician {
  const authUid = (technician.authUid ?? "").trim();
  if (authUid) return technician;
  if (devUiPreviewEnabled) {
    return { ...technician, authUid: getDefaultAssignedTechnicianUid() };
  }
  return technician;
}
