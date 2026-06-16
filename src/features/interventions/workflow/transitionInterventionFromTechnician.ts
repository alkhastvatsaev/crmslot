import { auth, firestore } from "@/core/config/firebase";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { requireAuthTransitionActor } from "@/features/interventions/workflow/workflowActor";

export type TransitionInterventionFromTechnicianParams = {
  interventionId: string;
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "createdByUid" | "companyId">;
  toStatus: Intervention["status"];
  note?: string;
  extraPatch?: Record<string, unknown>;
  writeInboxAlerts?: boolean;
};

/** Transition terrain (en route → sur place, attente matériel, etc.). */
export async function transitionInterventionFromTechnician(
  params: TransitionInterventionFromTechnicianParams
): Promise<void> {
  const { interventionId, iv, toStatus, note, extraPatch, writeInboxAlerts } = params;

  if (!firestore) throw new Error("Firestore indisponible");
  await transitionInterventionStatus({
    db: firestore,
    interventionId,
    iv,
    toStatus,
    actor: requireAuthTransitionActor("technician"),
    note,
    extraPatch,
    writeInboxAlerts,
  });
}
