import type { Intervention } from "@/features/interventions/types";

interface LatLng {
  lat: number;
  lng: number;
}

function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

/** Nearest-neighbor greedy tour from `start`. Returns reordered interventions. */
export function optimizeTourOrder(interventions: Intervention[], start: LatLng): Intervention[] {
  const withCoords = interventions.filter((iv) => iv.location?.lat && iv.location?.lng);
  const withoutCoords = interventions.filter((iv) => !iv.location?.lat || !iv.location?.lng);

  const remaining = [...withCoords];
  const ordered: Intervention[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(current, remaining[i].location);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    current = nearest.location;
  }

  return [...ordered, ...withoutCoords];
}

export async function getCurrentPosition(): Promise<LatLng> {
  const { getCurrentNativePosition } = await import("@/core/native/nativeGeolocation");
  const native = await getCurrentNativePosition().catch(() => null);
  if (native) return { lat: native.latitude, lng: native.longitude };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}
