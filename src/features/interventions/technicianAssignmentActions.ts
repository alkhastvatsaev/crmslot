import type { Intervention } from "@/features/interventions/types";

/** UID utilisé pour filtrer / accepter les missions sur la page technicien. */
export function getTechnicianAssignmentUid(authUid: string | null | undefined): string | null {
  const uid = (authUid ?? "").trim();
  return uid || null;
}

/** L’intervention cible ce technicien (`assignedTechnicianUid` = UID Auth effectif). */
export function matchesAssignedTechnician(
  iv: Pick<Intervention, "assignedTechnicianUid">,
  technicianUid: string | null | undefined
): boolean {
  const uid = (technicianUid ?? "").trim();
  const assigned = (iv.assignedTechnicianUid ?? "").trim();
  if (!uid || !assigned) return false;
  return assigned === uid;
}

/** Mission acceptée et en cours sur le terrain (`en_route` / `in_progress` / attente matériel). */
export function isTechnicianActiveFieldMission(
  iv: Pick<Intervention, "status" | "technicianAcceptedAt" | "assignedTechnicianUid">,
  technicianUid: string | null | undefined
): boolean {
  if (!matchesAssignedTechnician(iv, technicianUid)) return false;
  if (iv.status === "en_route" || iv.status === "waiting_material") return true;
  if (iv.status === "in_progress") return Boolean((iv.technicianAcceptedAt ?? "").trim());
  return false;
}

/** Le dispatch vient d’assigner — le technicien doit accepter ou refuser. */
export function isTechnicianAssignmentAwaitingResponse(
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "technicianAcceptedAt">,
  technicianUid: string | null | undefined
): boolean {
  if (!matchesAssignedTechnician(iv, technicianUid)) return false;
  if (iv.status === "assigned") return true;
  /** Dossiers assignés avant le statut `assigned` (migration). */
  if (iv.status === "in_progress" && !iv.technicianAcceptedAt) return true;
  return false;
}

export function acceptTechnicianAssignmentPatch(now = new Date()): Record<string, unknown> {
  return {
    status: "en_route" as const,
    technicianAcceptedAt: now.toISOString(),
  };
}

/** Mission déjà `in_progress` (legacy) — accepter = repartir en `en_route`. */
export function acceptTechnicianAssignmentInProgressPatch(
  now = new Date()
): Record<string, unknown> {
  return {
    status: "en_route" as const,
    technicianAcceptedAt: now.toISOString(),
  };
}

export function declineTechnicianAssignmentPatch(
  declinedByUid: string,
  now = new Date()
): Record<string, unknown> {
  return {
    status: "pending" as const,
    assignedTechnicianUid: null,
    technicianAcceptedAt: null,
    technicianDeclinedAt: now.toISOString(),
    technicianDeclinedByUid: declinedByUid,
    returnedToRequestsAt: now.toISOString(),
    returnedToRequestsReason: "technician_declined" as const,
  };
}
