import type { Intervention } from "@/features/interventions";
import type { AssignScheduleOverride } from "@/features/interventions";
import {
  localCalendarYmd,
  scheduledFieldsWhenReleasingToTechnician,
} from "@/features/interventions/technicianSchedule";
import { normalizeTimeHm } from "@/features/interventions/technicianScheduleParse";
import {
  proposeAvailableSlotsForTechnician,
  proposeCompanyOpenSlots,
  type ProposedSlot,
} from "@/features/scheduling/proposeAvailableSlots";
import { pickRecommendedSlot } from "@/features/scheduling/pickRecommendedSlot";
import {
  brusselsCalendarYmd,
  parseBrusselsSlotMs,
} from "@/features/scheduling/serverSchedulingTime";

export const SMART_ASSIGNMENT_HORIZON_DAYS = 14;

/**
 * Parse un créneau date+heure → ms epoch.
 * En mode serveur (`serverTz: true`), interprète comme Europe/Brussels.
 */
export function parseScheduleSlotStartMs(
  dateYmd: string,
  timeHm: string,
  serverTz = false
): number | null {
  if (serverTz) return parseBrusselsSlotMs(dateYmd, timeHm);
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
  now: Date = new Date(),
  serverTz = false
): boolean {
  const ms = parseScheduleSlotStartMs(dateYmd, timeHm, serverTz);
  if (ms == null) return true;
  return ms <= now.getTime();
}

export function addDaysYmd(dateYmd: string, days: number, serverTz = false): string {
  const anchor = parseScheduleSlotStartMs(dateYmd, "12:00", serverTz);
  if (anchor == null) return dateYmd;
  const d = new Date(anchor);
  d.setDate(d.getDate() + days);
  return serverTz ? brusselsCalendarYmd(d) : localCalendarYmd(d);
}

function resolveToday(now: Date, serverTz: boolean): string {
  return serverTz ? brusselsCalendarYmd(now) : localCalendarYmd(now);
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

export function filterFutureProposedSlots(
  slots: ProposedSlot[],
  now: Date = new Date(),
  serverTz = false
): ProposedSlot[] {
  const nowMs = now.getTime();
  return slots.filter((slot) => {
    const ms = parseScheduleSlotStartMs(slot.date, slot.time, serverTz);
    return ms != null && ms > nowMs;
  });
}

function filterFutureSlots(slots: ProposedSlot[], now: Date, serverTz = false): ProposedSlot[] {
  return filterFutureProposedSlots(slots, now, serverTz);
}

function slotsForDay(params: {
  dateYmd: string;
  technicianUid: string;
  peerInterventions: Intervention[];
  excludeInterventionId?: string;
  now: Date;
  serverTz?: boolean;
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
  return filterFutureSlots(raw, params.now, params.serverTz);
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
  /** Interprète les créneaux en Europe/Brussels au lieu du fuseau runtime. */
  serverTz?: boolean;
}): SmartAssignmentScheduleResult {
  const now = params.now ?? new Date();
  const maxDays = params.maxDaysAhead ?? SMART_ASSIGNMENT_HORIZON_DAYS;
  const override = params.scheduleOverride;
  const tz = params.serverTz ?? false;

  if (override?.scheduledDate?.trim() && override.scheduledTime?.trim()) {
    const scheduledDate = override.scheduledDate.trim();
    const scheduledTime =
      normalizeTimeHm(override.scheduledTime.trim()) ?? override.scheduledTime.trim();
    if (!isScheduleSlotInPast(scheduledDate, scheduledTime, now, tz)) {
      const baseline = scheduledFieldsWhenReleasingToTechnician(params.iv, now);
      const rescheduled =
        scheduledDate !== baseline.scheduledDate || scheduledTime !== baseline.scheduledTime;
      return {
        scheduledDate,
        scheduledTime,
        rescheduled,
        ...(rescheduled
          ? { originalDate: baseline.scheduledDate, originalTime: baseline.scheduledTime }
          : {}),
      };
    }
  }

  const baseline = scheduledFieldsWhenReleasingToTechnician(params.iv, now);
  const originalDate = baseline.scheduledDate;
  const originalTime = baseline.scheduledTime;
  const preferredTime =
    normalizeTimeHm(params.iv.requestedTime) ||
    normalizeTimeHm(params.iv.scheduledTime) ||
    baseline.scheduledTime;

  const baselinePast = isScheduleSlotInPast(originalDate, originalTime, now, tz);

  if (!baselinePast) {
    const sameDay = slotsForDay({
      dateYmd: originalDate,
      technicianUid: params.technicianUid,
      peerInterventions: params.peerInterventions,
      excludeInterventionId: params.iv.id,
      now,
      serverTz: tz,
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

  const searchStart = baselinePast ? resolveToday(now, tz) : originalDate;

  for (let offset = 0; offset < maxDays; offset += 1) {
    const dateYmd = addDaysYmd(searchStart, offset, tz);
    const daySlots = slotsForDay({
      dateYmd,
      technicianUid: params.technicianUid,
      peerInterventions: params.peerInterventions,
      excludeInterventionId: params.iv.id,
      now,
      serverTz: tz,
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

  throw new Error("Aucun créneau disponible pour ce technicien dans les 14 prochains jours.");
}
