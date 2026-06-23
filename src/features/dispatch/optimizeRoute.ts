import { optimizeTourOrder } from "@/features/interventions/optimizeTourOrder";
import type { Intervention } from "@/features/interventions";

type Coords = { lat: number; lng: number };

/** Thin wrapper around optimizeTourOrder with (origin, interventions) arg order. */
export function optimizeRouteOrder(origin: Coords, interventions: Intervention[]): Intervention[] {
  return optimizeTourOrder(interventions, origin);
}
