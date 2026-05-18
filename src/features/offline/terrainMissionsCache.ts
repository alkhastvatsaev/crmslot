import type { Intervention } from "@/features/interventions/types";

const STORAGE_PREFIX = "belgmap_terrain_missions_";

export type TerrainMissionCacheRow = Pick<
  Intervention,
  | "id"
  | "title"
  | "problem"
  | "address"
  | "status"
  | "scheduledDate"
  | "scheduledTime"
  | "clientFirstName"
  | "clientLastName"
  | "clientName"
>;

export function readTerrainMissionsCache(technicianUid: string): TerrainMissionCacheRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${technicianUid.trim()}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TerrainMissionCacheRow[]) : [];
  } catch {
    return [];
  }
}

export function writeTerrainMissionsCache(
  technicianUid: string,
  interventions: Intervention[],
): void {
  if (typeof window === "undefined" || !technicianUid.trim()) return;
  const rows: TerrainMissionCacheRow[] = interventions.slice(0, 80).map((iv) => ({
    id: iv.id,
    title: iv.title,
    problem: iv.problem,
    address: iv.address,
    status: iv.status,
    scheduledDate: iv.scheduledDate,
    scheduledTime: iv.scheduledTime,
    clientFirstName: iv.clientFirstName,
    clientLastName: iv.clientLastName,
    clientName: iv.clientName,
  }));
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${technicianUid.trim()}`, JSON.stringify(rows));
  } catch {
    /* quota */
  }
}
