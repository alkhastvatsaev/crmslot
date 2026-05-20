import type { Mission } from "@/features/map/missionTypes";

/** Clé stable pour dédoublonner / archiver une mission carte (Firestore id, fichier local, etc.). */
export function missionStableKey(mission: Pick<Mission, "id" | "key">): string {
  return mission.key ?? String(mission.id);
}
