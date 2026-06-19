import type { Intervention } from "@/features/interventions/types";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import type { CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";

export type CaseHubKpis = {
  openCount: number;
  activeCount: number;
  weekCount: number;
};

const OPEN_STATUSES = new Set<Intervention["status"]>([
  "pending",
  "assigned",
  "en_route",
  "in_progress",
  "waiting_material",
  "pending_needs_address",
]);

const ACTIVE_STATUSES = new Set<Intervention["status"]>([
  "assigned",
  "en_route",
  "in_progress",
  "waiting_material",
]);

const DONE_STATUSES = new Set<Intervention["status"]>(["done", "invoiced"]);

function interventionSortTime(iv: Intervention): number {
  const raw = iv.statusUpdatedAt ?? iv.createdAt ?? null;
  const d = coerceFirestoreLikeDate(raw);
  return d ? d.getTime() : 0;
}

function interventionOnCalendar(iv: Intervention, ymd: string): boolean {
  const d = (iv.scheduledDate ?? iv.requestedDate ?? "").trim();
  return d === ymd;
}

function weekRange(now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function buildCaseHubKpis(params: {
  interventions: Intervention[];
  now?: Date;
}): CaseHubKpis {
  const now = params.now ?? new Date();
  const { start, end } = weekRange(now);

  let openCount = 0;
  let activeCount = 0;
  let weekCount = 0;

  for (const iv of params.interventions) {
    const status = iv.status ?? "pending";
    if (OPEN_STATUSES.has(status)) openCount += 1;
    if (ACTIVE_STATUSES.has(status)) activeCount += 1;

    const sortD = coerceFirestoreLikeDate(iv.statusUpdatedAt ?? iv.createdAt);
    if (sortD && sortD >= start && sortD < end) weekCount += 1;

    const todayYmd = now.toISOString().slice(0, 10);
    if (interventionOnCalendar(iv, todayYmd) && !DONE_STATUSES.has(status)) {
      // counted via open/active already
    }
  }

  return { openCount, activeCount, weekCount };
}

export function filterCaseInterventions(
  interventions: Intervention[],
  filter: CaseHubStatusFilter
): Intervention[] {
  switch (filter) {
    case "open":
      return interventions.filter((iv) => OPEN_STATUSES.has(iv.status ?? "pending"));
    case "active":
      return interventions.filter((iv) => ACTIVE_STATUSES.has(iv.status ?? "pending"));
    case "done":
      return interventions.filter((iv) => DONE_STATUSES.has(iv.status ?? "pending"));
    default:
      return interventions;
  }
}

export function countForCaseFilter(
  interventions: Intervention[],
  filter: CaseHubStatusFilter
): number {
  return filterCaseInterventions(interventions, filter).length;
}

export function sortCaseInterventions(interventions: Intervention[]): Intervention[] {
  return [...interventions].sort((a, b) => interventionSortTime(b) - interventionSortTime(a));
}
