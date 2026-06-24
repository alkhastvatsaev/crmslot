import type { Intervention } from "@/features/interventions/types";
import { matchesAssignedTechnician } from "@/features/interventions/technicianAssignmentActions";

const CLOSED_STATUSES = new Set<Intervention["status"]>(["done", "invoiced", "cancelled"]);

export function isTechnicianInterventionUnclosed(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid">,
  technicianUid: string | null | undefined
): boolean {
  if (!matchesAssignedTechnician(iv, technicianUid)) return false;
  return !CLOSED_STATUSES.has(iv.status);
}

export function getTechnicianUnclosedInterventions(
  rows: Intervention[],
  technicianUid: string | null | undefined,
  options?: { excludeInterventionId?: string }
): Intervention[] {
  const exclude = options?.excludeInterventionId?.trim();
  return rows.filter((iv) => {
    if (exclude && iv.id === exclude) return false;
    return isTechnicianInterventionUnclosed(iv, technicianUid);
  });
}

export function isTechnicianBlockedByOpenDossiers(
  rows: Intervention[],
  technicianUid: string | null | undefined
): boolean {
  return getTechnicianUnclosedInterventions(rows, technicianUid).length > 0;
}

export function isTechnicianAcceptAssignmentBlocked(
  rows: Intervention[],
  technicianUid: string | null | undefined,
  acceptingInterventionId: string
): boolean {
  return (
    getTechnicianUnclosedInterventions(rows, technicianUid, {
      excludeInterventionId: acceptingInterventionId,
    }).length > 0
  );
}
