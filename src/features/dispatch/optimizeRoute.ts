import { haversineDistanceKm } from "@/features/dispatch/rankTechniciansForIntervention";
import type { Intervention } from "@/features/interventions/types";

type Coords = { lat: number; lng: number };

/**
 * Greedy nearest-neighbor TSP.
 * Starts from `origin`, always picks the closest unvisited intervention next.
 * O(n²) — acceptable for typical daily schedules (< 50 stops).
 */
export function optimizeRouteOrder(origin: Coords, interventions: Intervention[]): Intervention[] {
  if (interventions.length <= 1) return interventions;

  const withCoords = interventions.filter(
    (iv) => iv.location?.lat != null && iv.location?.lng != null
  );
  const withoutCoords = interventions.filter(
    (iv) => iv.location?.lat == null || iv.location?.lng == null
  );

  const remaining = [...withCoords];
  const ordered: Intervention[] = [];
  let current: Coords = origin;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const { lat, lng } = remaining[i].location;
      const dist = haversineDistanceKm(current.lat, current.lng, lat, lng);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = { lat: next.location.lat, lng: next.location.lng };
  }

  return [...ordered, ...withoutCoords];
}
