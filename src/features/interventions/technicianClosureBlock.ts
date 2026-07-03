import type { Intervention } from "@/features/interventions/types";
import {
  isTechnicianActiveFieldMission,
  isTechnicianAssignmentAwaitingResponse,
  matchesAssignedTechnician,
} from "@/features/interventions/technicianAssignmentActions";

/** Mission terrain active (en route / sur place acceptée / attente matériel) — bloque une nouvelle acceptation. */
export function isTechnicianBlockingActiveMission(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt">,
  technicianUid: string | null | undefined
): boolean {
  return isTechnicianActiveFieldMission(iv, technicianUid);
}

/**
 * Dossier encore ouvert (rappels push) : mission active ou assignation en attente de réponse.
 * N'inclut pas les statuts dispatch/back-office (`pending`, etc.).
 */
export function isTechnicianInterventionUnclosed(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt">,
  technicianUid: string | null | undefined
): boolean {
  if (!matchesAssignedTechnician(iv, technicianUid)) return false;
  return (
    isTechnicianActiveFieldMission(iv, technicianUid) ||
    isTechnicianAssignmentAwaitingResponse(iv, technicianUid)
  );
}

/** Statuts Firestore pour la requête blocage acceptation (affinée en mémoire via {@link isTechnicianBlockingActiveMission}). */
export const TECHNICIAN_ACCEPT_BLOCK_QUERY_STATUSES: Intervention["status"][] = [
  "en_route",
  "in_progress",
  "waiting_material",
];

export function getTechnicianBlockingActiveMissions(
  rows: Intervention[],
  technicianUid: string | null | undefined,
  options?: { excludeInterventionId?: string }
): Intervention[] {
  const exclude = options?.excludeInterventionId?.trim();
  return rows.filter((iv) => {
    if (exclude && iv.id === exclude) return false;
    return isTechnicianBlockingActiveMission(iv, technicianUid);
  });
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
  return getTechnicianBlockingActiveMissions(rows, technicianUid).length > 0;
}

export function isTechnicianAcceptAssignmentBlocked(
  rows: Intervention[],
  technicianUid: string | null | undefined,
  acceptingInterventionId: string
): boolean {
  return (
    getTechnicianBlockingActiveMissions(rows, technicianUid, {
      excludeInterventionId: acceptingInterventionId,
    }).length > 0
  );
}
