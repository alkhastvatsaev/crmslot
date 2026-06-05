/** Marqueur technicien statique sur la carte dispatch (démo visuelle). */
export type MapTechnicianMarkerDef = {
  id: string;
  name: string;
  /** [lng, lat] — Mapbox */
  coordinates: [number, number];
};

/** Mansour — centre de Bruxelles (Grote Markt / pentagone). */
export const BRUSSELS_CENTER_LNG_LAT: [number, number] = [4.3517, 50.8466];

export const MAP_DEMO_TECHNICIAN_MARKERS: readonly MapTechnicianMarkerDef[] = [
  {
    id: "mansour",
    name: "Mansour",
    coordinates: BRUSSELS_CENTER_LNG_LAT,
  },
] as const;
