import { auth, firestore } from "@/core/config/firebase";
import type { Intervention } from "@/features/interventions/types";
import { applyBackofficeTechnicianAssignmentClient } from "@/features/backoffice/applyBackofficeTechnicianAssignmentClient";

export type AssignInterventionSchedule = {
  scheduledDate: string;
  scheduledTime: string;
};

/** Assignation dispatch — écriture Firestore client + règles déployées. */
export async function assignInterventionFromBackoffice(
  id: string,
  row: Intervention,
  technicianUid: string,
  schedule?: AssignInterventionSchedule
): Promise<void> {
  if (!firestore) {
    throw new Error("Firestore indisponible");
  }
  const actorUid = auth?.currentUser?.uid?.trim();
  if (!actorUid) {
    throw Object.assign(new Error("Non connecté"), { code: "permission-denied" });
  }

  await applyBackofficeTechnicianAssignmentClient(id, row, technicianUid, actorUid, schedule);
}
