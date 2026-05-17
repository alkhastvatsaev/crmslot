import type { Intervention } from "@/features/interventions/types";
import {
  getInterventionOccupiedRange,
  interventionBlocksSchedule,
  rangesOverlap,
  type OccupiedTimeRange,
} from "@/features/scheduling/interventionOccupiedRange";
import {
  SCHEDULING_DEFAULT_DURATION_MS,
  SCHEDULING_WORK_SLOTS,
} from "@/features/scheduling/schedulingConstants";

export type ProposedSlot = {
  date: string;
  time: string;
};

export type ProposeSlotsParams = {
  interventions: Intervention[];
  technicianUid: string;
  dateYmd: string;
  excludeInterventionId?: string;
  slots?: readonly string[];
};

function slotToRange(dateYmd: string, timeHm: string): OccupiedTimeRange | null {
  const iso = `${dateYmd}T${timeHm}:00`;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  return {
    startMs: start.getTime(),
    endMs: start.getTime() + SCHEDULING_DEFAULT_DURATION_MS,
  };
}

/** Créneaux libres pour un technicien un jour donné (company-wide conflicts on that tech). */
export function proposeAvailableSlotsForTechnician(params: ProposeSlotsParams): ProposedSlot[] {
  const {
    interventions,
    technicianUid,
    dateYmd,
    excludeInterventionId,
    slots = SCHEDULING_WORK_SLOTS,
  } = params;

  const tech = technicianUid.trim();
  if (!tech || !dateYmd) return [];

  const occupied: OccupiedTimeRange[] = [];
  for (const iv of interventions) {
    if (excludeInterventionId && iv.id === excludeInterventionId) continue;
    if ((iv.assignedTechnicianUid ?? "").trim() !== tech) continue;
    if (!interventionBlocksSchedule(iv)) continue;
    const range = getInterventionOccupiedRange(iv);
    if (range) occupied.push(range);
  }

  const free: ProposedSlot[] = [];
  for (const time of slots) {
    const candidate = slotToRange(dateYmd, time);
    if (!candidate) continue;
    const clash = occupied.some((o) => rangesOverlap(o, candidate));
    if (!clash) free.push({ date: dateYmd, time });
  }

  return free;
}

/** Créneaux où aucun technicien de la société n’a de mission bloquante (file d’attente globale). */
export function proposeCompanyOpenSlots(params: {
  interventions: Intervention[];
  dateYmd: string;
  slots?: readonly string[];
}): ProposedSlot[] {
  const { interventions, dateYmd, slots = SCHEDULING_WORK_SLOTS } = params;
  const free: ProposedSlot[] = [];

  for (const time of slots) {
    const candidate = slotToRange(dateYmd, time);
    if (!candidate) continue;
    const busy = interventions.some((iv) => {
      if (!interventionBlocksSchedule(iv)) return false;
      const range = getInterventionOccupiedRange(iv);
      return range ? rangesOverlap(range, candidate) : false;
    });
    if (!busy) free.push({ date: dateYmd, time });
  }

  return free;
}
