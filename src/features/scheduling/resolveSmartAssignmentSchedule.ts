import type { Intervention } from "@/features/interventions";
import type { AssignScheduleOverride } from "@/features/interventions";
import {
  localCalendarYmd,
  scheduledFieldsWhenReleasingToTechnician,
} from "@/features/interventions/technicianSchedule";
import {
  proposeAvailableSlotsForTechnician,
  proposeCompanyOpenSlots,
  type ProposedSlot,
} from "@/features/scheduling/proposeAvailableSlots";
import { pickRecommendedSlot } from "@/features/scheduling/pickRecommendedSlot";
import { SCHEDULING_WORK_SLOTS } from "@/features/scheduling/schedulingConstants";

export const SMART_ASSIGNMENT_HORIZON_DAYS = 14;

export function parseScheduleSlotStartMs(dateYmd: string, timeHm: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeHm.trim());
  if (!dateMatch || !timeMatch) return null;
  const start = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );
  return Number.isNaN(start.getTime()) ? null : start.getTime();
}

export function isScheduleSlotInPast(
  dateYmd: string,
  timeHm: string,
  now: Date = new Date()
): boolean {
  const ms = parseScheduleSlotStartMs(dateYmd, timeHm);
  if (ms == null) return true;
  return ms <= now.getTime();
}

export function addDaysYmd(dateYmd: string, days: number): string {
  const anchor = parseScheduleSlotStartMs(dateYmd, "12:00");
  if (anchor == null) return dateYmd;
  const d = new Date(anchor);
  d.setDate(d.getDate() + days);
  return localCalendarYmd(d);
}

/** Date affichée / proposée dans l’UI quand le créneau client est dépassé. */
export function initialAssignmentDateYmd(
  iv: Pick<Intervention, "requestedDate" | "scheduledDate">,
  now: Date = new Date()
): string {
  const today = localCalendarYmd(now);
  const preferred = iv.scheduledDate?.trim() || iv.requestedDate?.trim() || "";
  if (preferred && preferred >= today) return preferred;
  return today;
}

function filterFutureSlots(slots: ProposedSlot[], now: Date): ProposedSlot[] {
  const nowMs = now.getTime();
  return slots.filter((slot) => {
    const ms = parseScheduleSlotStartMs(slot.date, slot.time);
    return ms != null && ms > nowMs;
  });
}

function slotsForDay(params: {
  dateYmd: string;
  technicianUid: string;
  peerInterventions: Intervention[];
  excludeInterventionId?: string;
  now: Date;
}): ProposedSlot[] {
  const tech = params.technicianUid.trim();
  const raw = tech
    ? proposeAvailableSlotsForTechnician({
        interventions: params.peerInterventions,
        technicianUid: tech,
        dateYmd: params.dateYmd,
        excludeInterventionId: params.excludeInterventionId,
      })
    : proposeCompanyOpenSlots({
        interventions: params.peerInterventions,
        dateYmd: params.dateYmd,
      });
  return filterFutureSlots(raw, params.now);
}

export type SmartAssignmentScheduleResult = {
  scheduledDate: string;
  scheduledTime: string;
  rescheduled: boolean;
  originalDate?: string;
  originalTime?: string;
};

/**
 * Créneau d’assignation intelligent : si le client a choisi une date/heure passée
 * (validation back-office tardive), propose aujourd’hui ou le prochain jour avec place.
 */
export function resolveSmartAssignmentSchedule(params: {
  iv: Pick<
    Intervention,
    "id" | "requestedDate" | "requestedTime" | "scheduledDate" | "scheduledTime"
  >;
  technicianUid: string;
  peerInterventions: Intervention[];
  scheduleOverride?: AssignScheduleOverride;
  now?: Date;
  maxDaysAhead?: number;
}): SmartAssignmentScheduleResult {
  const now = params.now ?? new Date();
  const maxDays = params.maxDaysAhead ?? SMART_ASSIGNMENT_HORIZON_DAYS;
  const override = params.scheduleOverride;

  if (override?.scheduledDate?.trim() && override.scheduledTime?.trim()) {
    const scheduledDate = override.scheduledDate.trim();
    const scheduledTime = override.scheduledTime.trim();
    if (!isScheduleSlotInPast(scheduledDate, scheduledTime, now)) {
      return { scheduledDate, scheduledTime, rescheduled: false };
    }
  }

  const baseline = scheduledFieldsWhenReleasingToTechnician(params.iv, now);
  const originalDate = baseline.scheduledDate;
  const originalTime = baseline.scheduledTime;
  const preferredTime =
    params.iv.requestedTime?.trim() || params.iv.scheduledTime?.trim() || baseline.scheduledTime;

  const baselinePast = isScheduleSlotInPast(originalDate, originalTime, now);

  if (!baselinePast) {
    const sameDay = slotsForDay({
      dateYmd: originalDate,
      technicianUid: params.technicianUid,
      peerInterventions: params.peerInterventions,
      excludeInterventionId: params.iv.id,
      now,
    });
    const picked = pickRecommendedSlot(sameDay, preferredTime);
    if (picked) {
      const rescheduled = picked !== originalTime;
      return {
        scheduledDate: originalDate,
        scheduledTime: picked,
        rescheduled,
        ...(rescheduled ? { originalDate, originalTime } : {}),
      };
    }
  }

  const searchStart = baselinePast ? localCalendarYmd(now) : originalDate;

  for (let offset = 0; offset < maxDays; offset += 1) {
    const dateYmd = addDaysYmd(searchStart, offset);
    const daySlots = slotsForDay({
      dateYmd,
      technicianUid: params.technicianUid,
      peerInterventions: params.peerInterventions,
      excludeInterventionId: params.iv.id,
      now,
    });
    if (daySlots.length === 0) continue;

    const scheduledTime = pickRecommendedSlot(daySlots, preferredTime) ?? daySlots[0]!.time;
    const changed = dateYmd !== originalDate || scheduledTime !== originalTime;
    return {
      scheduledDate: dateYmd,
      scheduledTime,
      rescheduled: baselinePast || changed,
      ...(baselinePast || changed ? { originalDate, originalTime } : {}),
    };
  }

  const today = localCalendarYmd(now);
  const fallbackSlots = filterFutureSlots(
    SCHEDULING_WORK_SLOTS.map((time) => ({ date: today, time })),
    now
  );
  const scheduledTime =
    pickRecommendedSlot(fallbackSlots, preferredTime) ?? SCHEDULING_WORK_SLOTS[0]!;

  return {
    scheduledDate: today,
    scheduledTime,
    rescheduled: true,
    originalDate,
    originalTime,
  };
}
