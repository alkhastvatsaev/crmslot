import { doc, updateDoc } from "firebase/firestore";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { auth, firestore } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignmentInProgressPatch,
  acceptTechnicianAssignmentPatch,
  declineTechnicianAssignmentPatch,
} from "@/features/interventions/technicianAssignmentActions";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { requireAuthTransitionActor } from "@/features/interventions/workflow/workflowActor";

export type TechnicianAssignmentResponse = "accept" | "decline";

async function postTechnicianResponse(
  interventionId: string,
  action: TechnicianAssignmentResponse,
): Promise<void> {
  const res = await fetchWithAuth(
    `/api/interventions/${encodeURIComponent(interventionId)}/technician-response`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Réponse technicien refusée");
  }
}

/**
 * Acceptation mission `assigned` → `en_route`.
 * En dev local : API Admin (même contrainte que l’assignation back-office).
 */
export async function acceptTechnicianAssignment(iv: Intervention): Promise<void> {
  if (devUiPreviewEnabled) {
    await postTechnicianResponse(iv.id, "accept");
    return;
  }

  if (!firestore) throw new Error("Firestore indisponible");

  if (iv.status === "in_progress" && !iv.technicianAcceptedAt) {
    await updateDoc(
      doc(firestore, "interventions", iv.id),
      acceptTechnicianAssignmentInProgressPatch(),
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

/**
 * Refus mission `assigned` → `pending` (désassignation).
 */
export async function declineTechnicianAssignment(
  iv: Intervention,
  technicianUid: string,
): Promise<void> {
  if (devUiPreviewEnabled) {
    await postTechnicianResponse(iv.id, "decline");
    return;
  }

  if (!firestore) throw new Error("Firestore indisponible");
  const actorUid = auth?.currentUser?.uid?.trim();
  if (!actorUid) throw new Error("Utilisateur non connecté");

  const declinePatch = declineTechnicianAssignmentPatch(technicianUid);
  if (iv.status === "in_progress" && !iv.technicianAcceptedAt) {
    await updateDoc(doc(firestore, "interventions", iv.id), declinePatch);
    const actorUid = auth?.currentUser?.uid?.trim() || technicianUid;
    await logCrmInterventionAction({
      kind: "intervention_technician_declined",
      iv,
      actorUid,
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
