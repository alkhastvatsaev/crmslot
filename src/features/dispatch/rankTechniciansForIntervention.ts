import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Technician } from "@/features/technicians";

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
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
  interventionLng: number
): RankedTechnician[] {
  const available = technicians.filter((t) => t.status === "available");
  const pool = available.length > 0 ? available : [...technicians];

  return pool
    .map((technician) => {
      const tLat = technician.location?.lat;
      const tLng = technician.location?.lng;
      let distanceKm = Number.MAX_VALUE;

      if (
        typeof interventionLat === "number" &&
        !Number.isNaN(interventionLat) &&
        typeof interventionLng === "number" &&
        !Number.isNaN(interventionLng) &&
        typeof tLat === "number" &&
        !Number.isNaN(tLat) &&
        typeof tLng === "number" &&
        !Number.isNaN(tLng)
      ) {
        distanceKm = haversineDistanceKm(interventionLat, interventionLng, tLat, tLng);
      }

      return {
        technician,
        distanceKm: Number.isNaN(distanceKm) ? Number.MAX_VALUE : distanceKm,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Met Mansour / UID par défaut en tête du picker (aligné page 3 technicien). */
export function prioritizeDefaultAssignTechnician(ranked: RankedTechnician[]): RankedTechnician[] {
  const defaultUid = getDefaultAssignedTechnicianUid();
  const sorted = [...ranked].sort((a, b) => {
    const score = (t: Technician) => {
      const uid = (t.authUid ?? "").trim();
      if (uid && uid === defaultUid) return 0;
      if (/mansour/i.test(t.name)) return 0;
      return 1;
    };
    const sa = score(a.technician);
    const sb = score(b.technician);
    if (sa !== sb) return sa - sb;
    return a.distanceKm - b.distanceKm;
  });
  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}
