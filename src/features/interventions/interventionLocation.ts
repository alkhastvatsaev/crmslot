import type { Intervention } from "@/features/interventions/types";

const DEFAULT_LAT = 50.8466;
const DEFAULT_LNG = 4.3522;

/** Coordonnées utilisables pour dispatch / assignation (repli Bruxelles). */
export function interventionLocationOrDefault(
  iv: Pick<Intervention, "location"> | { location?: Intervention["location"] },
): { lat: number; lng: number } {
  const lat = iv.location?.lat;
  const lng = iv.location?.lng;
  if (
    typeof lat === "number" &&
    !Number.isNaN(lat) &&
    typeof lng === "number" &&
    !Number.isNaN(lng)
  ) {
    return { lat, lng };
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
}
