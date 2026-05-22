import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { auth, firestore } from "@/core/config/firebase";
import { devUiPreviewEnabled } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";
import { applyBackofficeTechnicianAssignmentClient } from "@/features/backoffice/applyBackofficeTechnicianAssignmentClient";

export type AssignInterventionSchedule = {
  scheduledDate: string;
  scheduledTime: string;
};

/**
 * Assignation dispatch — en dev local (`devUiPreviewEnabled`), passe par l’API Admin
 * pour éviter `permission-denied` tant que les règles Firestore ne sont pas déployées.
 */
export async function assignInterventionFromBackoffice(
  id: string,
  row: Intervention,
  technicianUid: string,
  schedule?: AssignInterventionSchedule,
): Promise<void> {
  if (devUiPreviewEnabled) {
    const res = await fetchWithAuth(`/api/interventions/${encodeURIComponent(id)}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        technicianUid,
        scheduledDate: schedule?.scheduledDate,
        scheduledTime: schedule?.scheduledTime,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok) {
      const code =
        res.status === 403
          ? "permission-denied"
          : res.status === 503
            ? "admin-unavailable"
            : "assign-failed";
      throw Object.assign(new Error(data.error || "Assignation refusée"), { code });
    }
    return;
  }

  if (!firestore) {
    throw new Error("Firestore indisponible");
  }
  const actorUid = auth?.currentUser?.uid?.trim();
  if (!actorUid) {
    throw Object.assign(new Error("Non connecté"), { code: "permission-denied" });
  }

  await applyBackofficeTechnicianAssignmentClient(id, row, technicianUid, actorUid, schedule);
}
