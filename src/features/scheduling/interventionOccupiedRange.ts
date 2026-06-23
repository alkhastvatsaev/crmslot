import type { Intervention } from "@/features/interventions";
import { getInterventionScheduledRange } from "@/features/calendar/interventionScheduleRange";
import {
  SCHEDULING_BLOCKING_STATUSES,
  SCHEDULING_DEFAULT_DURATION_MS,
} from "@/features/scheduling/schedulingConstants";

export type OccupiedTimeRange = {
  startMs: number;
  endMs: number;
};

function parseLocalDateTime(dateYmd: string, timeHm: string): Date | null {
  const d = dateYmd.trim();
  const t = timeHm.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !t) return null;
  const iso = `${d}T${t.length === 5 ? t : t.slice(0, 5)}:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Plage horaire occupée par le dossier (planifié ou souhaité client). */
export function getInterventionOccupiedRange(iv: Intervention): OccupiedTimeRange | null {
  const scheduled = getInterventionScheduledRange(iv);
  if (scheduled) {
    return { startMs: scheduled.start.getTime(), endMs: scheduled.end.getTime() };
  }

  const reqStart = parseLocalDateTime(iv.requestedDate ?? "", iv.requestedTime ?? "");
  if (!reqStart) return null;
  return {
    startMs: reqStart.getTime(),
    endMs: reqStart.getTime() + SCHEDULING_DEFAULT_DURATION_MS,
  };
}

export function interventionBlocksSchedule(iv: Pick<Intervention, "status">): boolean {
  return (SCHEDULING_BLOCKING_STATUSES as readonly string[]).includes(iv.status);
}

export function rangesOverlap(a: OccupiedTimeRange, b: OccupiedTimeRange): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}
