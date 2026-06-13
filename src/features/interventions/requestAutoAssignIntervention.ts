import { fetchWithAuth } from "@/core/api/fetchWithAuth";

/** Demande l'assignation IA du technicien le plus proche. */
export async function requestAutoAssignIntervention(interventionId: string): Promise<{
  assigned: boolean;
  technicianName?: string;
}> {
  const res = await fetchWithAuth(
    `/api/interventions/${encodeURIComponent(interventionId)}/auto-assign`,
    { method: "POST" }
  );
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    assigned?: boolean;
    technicianName?: string;
    error?: string;
  };
  if (!res.ok || !data.ok) {
    return { assigned: false };
  }
  return {
    assigned: Boolean(data.assigned),
    technicianName: data.technicianName,
  };
}
