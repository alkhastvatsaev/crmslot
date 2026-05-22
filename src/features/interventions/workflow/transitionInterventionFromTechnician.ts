import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { auth, firestore } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { requireAuthTransitionActor } from "@/features/interventions/workflow/workflowActor";

export type TransitionInterventionFromTechnicianParams = {
  interventionId: string;
  iv: Pick<
    Intervention,
    "status" | "assignedTechnicianUid" | "createdByUid" | "companyId"
  >;
  toStatus: Intervention["status"];
  note?: string;
  extraPatch?: Record<string, unknown>;
  writeInboxAlerts?: boolean;
};

/**
 * Transition terrain (en route → sur place, attente matériel, etc.).
 * En dev local : API Admin pour éviter `permission-denied` Firestore client.
 */
export async function transitionInterventionFromTechnician(
  params: TransitionInterventionFromTechnicianParams,
): Promise<void> {
  const { interventionId, iv, toStatus, note, extraPatch, writeInboxAlerts } = params;

  if (devUiPreviewEnabled) {
    const res = await fetchWithAuth(
      `/api/interventions/${encodeURIComponent(interventionId)}/transition`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, note, extraPatch }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok) {
      throw new Error(data.error || "Transition refusée");
    }
    return;
  }

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
