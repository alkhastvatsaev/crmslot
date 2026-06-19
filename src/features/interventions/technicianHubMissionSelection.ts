import type { Intervention } from "@/features/interventions/types";

/** Garde la sélection courante si elle est encore dans la liste du jour, sinon 1ère mission. */
export function resolveTechnicianHubMissionSelection(
  prev: string | null,
  dayMissions: Intervention[]
): string | null {
  if (dayMissions.length === 0) return null;
  if (prev && dayMissions.some((iv) => iv.id === prev)) return prev;
  return dayMissions[0]?.id ?? null;
}
