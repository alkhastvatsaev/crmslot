import type { Technician } from "@/features/technicians/types";

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type RankedTechnician = {
  technician: Technician;
  distanceKm: number;
  rank: number;
};

/** Classe les techniciens par proximité (Haversine). Priorise ceux « available ». */
export function rankTechniciansForIntervention(
  technicians: Technician[],
  interventionLat: number,
  interventionLng: number,
): RankedTechnician[] {
  const available = technicians.filter((t) => t.status === "available");
  const pool = available.length > 0 ? available : [...technicians];

  return pool
    .map((technician) => ({
      technician,
      distanceKm: haversineDistanceKm(
        interventionLat,
        interventionLng,
        technician.location.lat,
        technician.location.lng,
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
