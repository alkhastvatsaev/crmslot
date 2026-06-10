import type { Intervention } from "@/features/interventions/types";

/**
 * Statut cible quand le technicien confirme son arrivée sur site.
 * Seules les transitions légales du workflow sont proposées :
 * en_route → in_progress, assigned → en_route (départ oublié).
 */
export function geofenceArrivalNextStatus(
  status: Intervention["status"]
): Intervention["status"] | null {
  if (status === "en_route") return "in_progress";
  if (status === "assigned") return "en_route";
  return null;
}
