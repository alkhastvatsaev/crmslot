import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { Intervention } from "@/features/interventions/types";

export type TransitionInterventionFromTechnicianParams = {
  interventionId: string;
  iv: Pick<Intervention, "status" | "assignedTechnicianUid" | "createdByUid" | "companyId">;
  toStatus: Intervention["status"];
  note?: string;
  extraPatch?: Record<string, unknown>;
  writeInboxAlerts?: boolean;
};

type TransitionResponseBody = {
  ok?: boolean;
  error?: string;
};

/** Sérialise extraPatch Firestore (ex. serverTimestamp) pour l’API JSON. */
export function serializeTechnicianExtraPatchForApi(
  extraPatch?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!extraPatch) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extraPatch)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === "object") {
      const maybeFieldValue = value as { _methodName?: string };
      if (maybeFieldValue._methodName === "serverTimestamp") {
        if (key === "completedAt" || key === "statusUpdatedAt") {
          out[key] = new Date().toISOString();
        }
        continue;
      }
    }
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Transition terrain (en route → sur place, attente matériel, clôture, etc.) via API Admin. */
export async function transitionInterventionFromTechnician(
  params: TransitionInterventionFromTechnicianParams
): Promise<void> {
  const { interventionId, toStatus, note, extraPatch } = params;
  const id = interventionId.trim();
  if (!id) throw new Error("Identifiant intervention manquant");

  const res = await fetchWithAuth(`/api/interventions/${encodeURIComponent(id)}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      toStatus,
      note: note?.trim() || undefined,
      extraPatch: serializeTechnicianExtraPatchForApi(extraPatch),
    }),
  });

  let body: TransitionResponseBody = {};
  try {
    body = (await res.json()) as TransitionResponseBody;
  } catch {
    /* corps vide */
  }

  if (!res.ok) {
    throw new Error(body.error?.trim() || `Erreur serveur (${res.status})`);
  }
  if (body.ok === false) {
    throw new Error(body.error?.trim() || "Transition refusée");
  }
}
