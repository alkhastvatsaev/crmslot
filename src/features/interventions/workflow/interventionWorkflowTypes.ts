import type { Intervention } from "@/features/interventions/types";

/** Rôle du responsable actuel du dossier (dénormalisé sur l’intervention). */
export type WorkflowOwnerRole = "dispatcher" | "technician" | "client" | "system";

export type InterventionStatusEvent = {
  id: string;
  interventionId: string;
  fromStatus: Intervention["status"] | null;
  toStatus: Intervention["status"];
  actorUid: string;
  actorRole: WorkflowOwnerRole;
  note?: string | null;
  at: string;
  companyId?: string | null;
};

export type TransitionActor = {
  uid: string;
  role: WorkflowOwnerRole;
};

export const TERMINAL_INTERVENTION_STATUSES: ReadonlySet<Intervention["status"]> = new Set([
  "invoiced",
  "cancelled",
]);
