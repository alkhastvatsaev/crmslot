import { devUiPreviewEnabled, realInterventionsOnly } from "@/core/config/devUiPreview";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians/types";

/** Complète `authUid` en démo uniquement — jamais en prod réelle sans UID Auth lié. */
export function withTechnicianAuthUid(technician: Technician): Technician {
  const authUid = (technician.authUid ?? "").trim();
  if (authUid) return technician;
  if (devUiPreviewEnabled && !realInterventionsOnly) {
    return { ...technician, authUid: getDefaultAssignedTechnicianUid() };
  }
  return technician;
}
