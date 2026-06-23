import { auth } from "@/core/config/firebase";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { Intervention } from "@/features/interventions";

export type AssignInterventionSchedule = {
  scheduledDate: string;
  scheduledTime: string;
};

export type AssignInterventionResult = {
  scheduledDate: string;
  scheduledTime: string;
  rescheduled: boolean;
};

/** Assignation dispatch — API serveur (Admin SDK) en prod, droits société requis. */
export async function assignInterventionFromBackoffice(
  id: string,
  _row: Intervention,
  technicianUid: string,
  schedule?: AssignInterventionSchedule
): Promise<AssignInterventionResult | null> {
  const actorUid = auth?.currentUser?.uid?.trim();
  if (!actorUid) {
    throw Object.assign(new Error("Non connecté"), { code: "permission-denied" });
  }

  const res = await fetchWithAuth(`/api/interventions/${encodeURIComponent(id)}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      technicianUid,
      ...(schedule
        ? { scheduledDate: schedule.scheduledDate, scheduledTime: schedule.scheduledTime }
        : {}),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    rescheduled?: boolean;
  };
  if (!res.ok || !data.ok) {
    const message = typeof data.error === "string" ? data.error : "Assignation échouée";
    throw Object.assign(new Error(message), {
      code: res.status === 403 ? "permission-denied" : undefined,
    });
  }

  if (
    typeof data.scheduledDate === "string" &&
    typeof data.scheduledTime === "string" &&
    typeof data.rescheduled === "boolean"
  ) {
    return {
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      rescheduled: data.rescheduled,
    };
  }
  return null;
}
