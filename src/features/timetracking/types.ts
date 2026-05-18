export type TimeEntryType = "travel" | "on_site" | "admin" | "break";

export interface TimeEntry {
  id: string;
  companyId: string;
  technicianUid: string;
  interventionId?: string | null;
  type: TimeEntryType;
  startedAt: string;
  endedAt?: string | null;
  /** Durée en minutes (calculée à la clôture). */
  durationMinutes?: number | null;
  notes?: string | null;
}

export const TIME_ENTRY_LABELS: Record<TimeEntryType, string> = {
  travel: "Déplacement",
  on_site: "Sur site",
  admin: "Administratif",
  break: "Pause",
};

export function computeDurationMinutes(startedAt: string, endedAt: string): number {
  return Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export function totalDurationByType(
  entries: TimeEntry[],
): Record<TimeEntryType, number> {
  const result: Record<TimeEntryType, number> = { travel: 0, on_site: 0, admin: 0, break: 0 };
  for (const e of entries) {
    if (e.durationMinutes) result[e.type] += e.durationMinutes;
  }
  return result;
}
