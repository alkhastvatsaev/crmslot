import type { Intervention } from "@/features/interventions/types";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import { isServerDevUiPreview } from "@/features/backoffice/assignInterventionServerAuth";

/** Mission assignée à ce technicien (dev : UID démo sur `demo-tech-local`). */
export function assertTechnicianMayUpdateAssignedIntervention(
  iv: Pick<Intervention, "assignedTechnicianUid">,
  authUid: string,
): boolean {
  const assigned = (iv.assignedTechnicianUid ?? "").trim();
  const uid = authUid.trim();
  if (!assigned || !uid) return false;
  if (assigned === uid) return true;
  if (!isServerDevUiPreview()) return false;
  return assigned === getDefaultAssignedTechnicianUid();
}

/** Le technicien connecté peut répondre à une offre en attente (`assigned` ou legacy `in_progress`). */
export function assertTechnicianMayRespondToAssignment(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt">,
  authUid: string,
): boolean {
  const awaiting =
    iv.status === "assigned" ||
    (iv.status === "in_progress" && !iv.technicianAcceptedAt);
  if (!awaiting) return false;
  return assertTechnicianMayUpdateAssignedIntervention(iv, authUid);
}
