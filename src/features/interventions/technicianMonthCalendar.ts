import type { Intervention } from "@/features/interventions/types";
import {
  isTechnicianAssignmentAwaitingResponse,
  matchesAssignedTechnician,
} from "@/features/interventions/technicianAssignmentActions";
import {
  coerceFirestoreLikeDate,
  getScheduleAnchor,
  localCalendarYmd,
} from "@/features/interventions/technicianSchedule";

export type TechnicianDayMissionSummary = {
  total: number;
  pending: number;
  completed: number;
  awaiting: number;
};

export type TechnicianMonthDayTone = "empty" | "awaiting" | "scheduled" | "completed" | "mixed";

export type CalendarMonthCell = {
  date: Date;
  inMonth: boolean;
  ymd: string;
};

function emptySummary(): TechnicianDayMissionSummary {
  return { total: 0, pending: 0, completed: 0, awaiting: 0 };
}

function bumpSummary(
  map: Map<string, TechnicianDayMissionSummary>,
  ymd: string,
  field: keyof Omit<TechnicianDayMissionSummary, "total">
) {
  const cur = map.get(ymd) ?? emptySummary();
  cur[field] += 1;
  cur.total += 1;
  map.set(ymd, cur);
}

export function startOfCalendarMonth(ref: Date): Date {
  const d = new Date(ref);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addCalendarMonths(ref: Date, delta: number): Date {
  const d = new Date(ref);
  d.setMonth(d.getMonth() + delta, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeekMonday(ref: Date): Date {
  const x = new Date(ref);
  const dow = x.getDay();
  const offsetFromMonday = (dow + 6) % 7;
  x.setDate(x.getDate() - offsetFromMonday);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Grille 6×7 — semaine commence lundi. */
export function buildCalendarMonthCells(monthAnchor: Date): CalendarMonthCell[] {
  const first = startOfCalendarMonth(monthAnchor);
  const gridStart = startOfWeekMonday(first);
  const targetMonth = first.getMonth();
  const cells: CalendarMonthCell[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === targetMonth,
      ymd: localCalendarYmd(date),
    });
  }

  return cells;
}

/** Agrège les missions assignées par jour (planifié ou clôturé ce jour-là). */
export function buildTechnicianMissionDaySummaries(
  interventions: Intervention[],
  technicianUid: string | null | undefined
): Map<string, TechnicianDayMissionSummary> {
  const map = new Map<string, TechnicianDayMissionSummary>();

  for (const iv of interventions) {
    if (!matchesAssignedTechnician(iv, technicianUid)) continue;
    if (iv.status === "cancelled") continue;

    const awaiting = isTechnicianAssignmentAwaitingResponse(iv, technicianUid);
    const completed = iv.status === "done" || iv.status === "invoiced";
    const pending = !completed && !awaiting;

    const anchor = getScheduleAnchor(iv);
    const scheduleKey = anchor.getTime() > 0 ? localCalendarYmd(anchor) : null;

    if (scheduleKey) {
      if (awaiting) bumpSummary(map, scheduleKey, "awaiting");
      else if (completed) bumpSummary(map, scheduleKey, "completed");
      else if (pending) bumpSummary(map, scheduleKey, "pending");
    }

    const completedAt = coerceFirestoreLikeDate(iv.completedAt);
    if (completed && completedAt) {
      const completedKey = localCalendarYmd(completedAt);
      if (completedKey !== scheduleKey) {
        bumpSummary(map, completedKey, "completed");
      }
    }
  }

  return map;
}

export function resolveTechnicianMonthDayTone(
  summary: TechnicianDayMissionSummary | undefined
): TechnicianMonthDayTone {
  if (!summary || summary.total === 0) return "empty";
  const kinds = [summary.awaiting > 0, summary.pending > 0, summary.completed > 0].filter(
    Boolean
  ).length;
  if (kinds > 1) return "mixed";
  if (summary.awaiting > 0) return "awaiting";
  if (summary.pending > 0) return "scheduled";
  return "completed";
}

export function formatTechnicianMonthTitle(monthAnchor: Date, locale: string): string {
  return monthAnchor.toLocaleDateString(locale, { month: "long", year: "numeric" });
}
