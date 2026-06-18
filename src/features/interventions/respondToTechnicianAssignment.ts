import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { Intervention } from "@/features/interventions/types";

type TechnicianResponseBody = {
  ok?: boolean;
  error?: string;
};

async function postTechnicianAssignmentResponse(
  interventionId: string,
  action: "accept" | "decline"
): Promise<void> {
  const id = interventionId.trim();
  if (!id) throw new Error("Identifiant intervention manquant");

  const res = await fetchWithAuth(
    `/api/interventions/${encodeURIComponent(id)}/technician-response`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }
  );

  let body: TechnicianResponseBody = {};
  try {
    body = (await res.json()) as TechnicianResponseBody;
  } catch {
    /* corps vide */
  }

  if (!res.ok) {
    throw new Error(body.error?.trim() || `Erreur serveur (${res.status})`);
  }
  if (body.ok === false) {
    throw new Error(body.error?.trim() || "Action refusée");
  }
}

/** Acceptation mission `assigned` → `en_route`. */
export async function acceptTechnicianAssignment(iv: Intervention): Promise<void> {
  await postTechnicianAssignmentResponse(iv.id, "accept");
}

/** Refus mission `assigned` → `pending` (désassignation). */
export async function declineTechnicianAssignment(
  iv: Intervention,
  _technicianUid: string
): Promise<void> {
  await postTechnicianAssignmentResponse(iv.id, "decline");
}
