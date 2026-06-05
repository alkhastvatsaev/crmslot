import type { Intervention } from "@/features/interventions/types";
import type { TransitionActor, WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";

/** Transitions métier autorisées (machine à états). */
export const INTERVENTION_STATUS_TRANSITIONS: Record<
  Intervention["status"],
  readonly Intervention["status"][]
> = {
  pending: ["assigned", "cancelled"],
  pending_needs_address: ["pending", "cancelled"],
  assigned: ["en_route", "pending", "cancelled"],
  en_route: ["in_progress", "waiting_material", "cancelled"],
  in_progress: ["waiting_material", "done", "cancelled"],
  waiting_material: ["in_progress", "cancelled"],
  done: ["invoiced", "in_progress"],
  invoiced: [],
  cancelled: [],
};

const TRANSITION_KEY = (from: Intervention["status"], to: Intervention["status"]) => `${from}->${to}`;

/** Transitions réservées au terrain (technicien assigné). */
const TECHNICIAN_TRANSITION_KEYS = new Set<string>([
  TRANSITION_KEY("assigned", "en_route"),
  TRANSITION_KEY("assigned", "pending"),
  TRANSITION_KEY("en_route", "in_progress"),
  TRANSITION_KEY("en_route", "waiting_material"),
  TRANSITION_KEY("in_progress", "waiting_material"),
  TRANSITION_KEY("waiting_material", "in_progress"),
  TRANSITION_KEY("in_progress", "done"),
  TRANSITION_KEY("done", "in_progress"),
]);

/** Transitions back-office / dispatch. */
const DISPATCHER_TRANSITION_KEYS = new Set<string>([
  TRANSITION_KEY("pending", "assigned"),
  TRANSITION_KEY("pending", "cancelled"),
  TRANSITION_KEY("pending_needs_address", "pending"),
  TRANSITION_KEY("pending_needs_address", "cancelled"),
  TRANSITION_KEY("assigned", "cancelled"),
  TRANSITION_KEY("en_route", "cancelled"),
  TRANSITION_KEY("in_progress", "cancelled"),
  TRANSITION_KEY("waiting_material", "cancelled"),
  TRANSITION_KEY("done", "invoiced"),
]);

export function canTransitionInterventionStatus(
  from: Intervention["status"],
  to: Intervention["status"],
): boolean {
  if (from === to) return false;
  return INTERVENTION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAllowed(
  from: Intervention["status"],
  to: Intervention["status"],
): void {
  if (!canTransitionInterventionStatus(from, to)) {
    throw new Error(`Transition interdite : ${from} → ${to}`);
  }
}

export function actorMayTransition(
  actor: TransitionActor,
  from: Intervention["status"],
  to: Intervention["status"],
): boolean {
  if (!canTransitionInterventionStatus(from, to)) return false;
  const key = TRANSITION_KEY(from, to);
  if (actor.role === "technician") return TECHNICIAN_TRANSITION_KEYS.has(key);
  if (actor.role === "dispatcher") return DISPATCHER_TRANSITION_KEYS.has(key);
  if (actor.role === "system") return key === TRANSITION_KEY("done", "invoiced");
  return false;
}

export function resolveOwnerAfterTransition(
  toStatus: Intervention["status"],
  iv: Pick<Intervention, "assignedTechnicianUid" | "createdByUid">,
): { currentOwnerUid: string | null; currentOwnerRole: WorkflowOwnerRole } {
  switch (toStatus) {
    case "assigned":
    case "en_route":
    case "in_progress":
    case "waiting_material":
      return {
        currentOwnerUid: (iv.assignedTechnicianUid ?? "").trim() || null,
        currentOwnerRole: "technician",
      };
    case "pending":
    case "pending_needs_address":
    case "done":
    case "invoiced":
      return { currentOwnerUid: null, currentOwnerRole: "dispatcher" };
    case "cancelled":
      return { currentOwnerUid: null, currentOwnerRole: "system" };
    default:
      return { currentOwnerUid: null, currentOwnerRole: "dispatcher" };
  }
}

export function buildStatusTransitionPatch(params: {
  fromStatus: Intervention["status"];
  toStatus: Intervention["status"];
  iv: Pick<Intervention, "assignedTechnicianUid" | "createdByUid">;
  now?: Date;
  extraPatch?: Record<string, unknown>;
}): Record<string, unknown> {
  const { fromStatus, toStatus, iv, now = new Date(), extraPatch } = params;
  assertTransitionAllowed(fromStatus, toStatus);
  const owner = resolveOwnerAfterTransition(toStatus, iv);
  return {
    status: toStatus,
    currentOwnerUid: owner.currentOwnerUid,
    currentOwnerRole: owner.currentOwnerRole,
    statusUpdatedAt: now.toISOString(),
    ...extraPatch,
  };
}

/** UIDs à notifier (hors acteur) après changement de statut. */
export function statusChangeNotificationTargets(
  iv: Pick<Intervention, "assignedTechnicianUid" | "createdByUid">,
  toStatus: Intervention["status"],
  actorUid: string,
): string[] {
  const targets = new Set<string>();
  const tech = (iv.assignedTechnicianUid ?? "").trim();
  const creator = (iv.createdByUid ?? "").trim();
  if (tech && tech !== actorUid) targets.add(tech);
  if (creator && creator !== actorUid) targets.add(creator);
  if (toStatus === "assigned" && tech) targets.add(tech);
  return [...targets];
}
