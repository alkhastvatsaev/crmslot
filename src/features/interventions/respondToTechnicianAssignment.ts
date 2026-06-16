import { doc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignmentInProgressPatch,
  acceptTechnicianAssignmentPatch,
  declineTechnicianAssignmentPatch,
} from "@/features/interventions/technicianAssignmentActions";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { requireAuthTransitionActor } from "@/features/interventions/workflow/workflowActor";

/** Acceptation mission `assigned` → `en_route`. */
export async function acceptTechnicianAssignment(iv: Intervention): Promise<void> {
  if (!firestore) throw new Error("Firestore indisponible");

  if (iv.status === "in_progress" && !iv.technicianAcceptedAt) {
    await updateDoc(
      doc(firestore, "interventions", iv.id),
      acceptTechnicianAssignmentInProgressPatch()
    );
    return;
  }

  await transitionInterventionStatus({
    db: firestore,
    interventionId: iv.id,
    iv,
    toStatus: "en_route",
    actor: requireAuthTransitionActor("technician"),
    extraPatch: acceptTechnicianAssignmentPatch(),
  });
}

/** Refus mission `assigned` → `pending` (désassignation). */
export async function declineTechnicianAssignment(
  iv: Intervention,
  technicianUid: string
): Promise<void> {
  if (!firestore) throw new Error("Firestore indisponible");
  const actorUid = auth?.currentUser?.uid?.trim();
  if (!actorUid) throw new Error("Utilisateur non connecté");

  const declinePatch = declineTechnicianAssignmentPatch(technicianUid);
  if (iv.status === "in_progress" && !iv.technicianAcceptedAt) {
    await updateDoc(doc(firestore, "interventions", iv.id), declinePatch);
    const declineActorUid = auth?.currentUser?.uid?.trim() || technicianUid;
    await logCrmInterventionAction({
      kind: "intervention_technician_declined",
      iv,
      actorUid: declineActorUid,
      actorRole: "technician",
      statusBefore: iv.status,
      statusAfter: "pending",
    });
    return;
  }

  await transitionInterventionStatus({
    db: firestore,
    interventionId: iv.id,
    iv,
    toStatus: "pending",
    actor: requireAuthTransitionActor("technician"),
    extraPatch: declinePatch,
  });
}
