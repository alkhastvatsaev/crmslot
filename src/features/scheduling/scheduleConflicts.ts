import type { Intervention } from "@/features/interventions";
import {
  getInterventionOccupiedRange,
  interventionBlocksSchedule,
  rangesOverlap,
  type OccupiedTimeRange,
} from "@/features/scheduling/interventionOccupiedRange";

export type ScheduleConflict = {
  interventionId: string;
  clientLabel: string;
  scheduledDate: string;
  scheduledTime: string;
  status: Intervention["status"];
};

export type FindScheduleConflictsParams = {
  interventions: Intervention[];
  technicianUid: string;
  candidateRange: OccupiedTimeRange;
  excludeInterventionId?: string;
};

function interventionClientShort(iv: Intervention): string {
  const last = (iv.clientLastName ?? "").trim();
  const first = (iv.clientFirstName ?? "").trim();
  if (last || first) return [first, last].filter(Boolean).join(" ");
  return (iv.clientName ?? iv.title ?? iv.id).trim() || iv.id;
}

export function findTechnicianScheduleConflicts(
  params: FindScheduleConflictsParams
): ScheduleConflict[] {
  const { interventions, technicianUid, candidateRange, excludeInterventionId } = params;
  const tech = technicianUid.trim();
  if (!tech) return [];

  const conflicts: ScheduleConflict[] = [];

  for (const iv of interventions) {
    if (excludeInterventionId && iv.id === excludeInterventionId) continue;
    if ((iv.assignedTechnicianUid ?? "").trim() !== tech) continue;
    if (!interventionBlocksSchedule(iv)) continue;

    const range = getInterventionOccupiedRange(iv);
    if (!range || !rangesOverlap(range, candidateRange)) continue;

    conflicts.push({
      interventionId: iv.id,
      clientLabel: interventionClientShort(iv),
      scheduledDate: iv.scheduledDate ?? iv.requestedDate ?? "",
      scheduledTime: iv.scheduledTime ?? iv.requestedTime ?? "",
      status: iv.status,
    });
  }

  return conflicts;
}

export function candidateRangeFromScheduleFields(
  scheduledDate: string,
  scheduledTime: string,
  durationMs?: number
): OccupiedTimeRange | null {
  const mock = {
    scheduledDate,
    scheduledTime,
    requestedDate: null,
    requestedTime: null,
  } as Intervention;
  const range = getInterventionOccupiedRange(mock);
  if (!range) return null;
  if (durationMs && durationMs > 0) {
    return { startMs: range.startMs, endMs: range.startMs + durationMs };
  }
  return range;
}
