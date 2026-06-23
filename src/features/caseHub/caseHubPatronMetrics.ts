import type { Intervention } from "@/features/interventions";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import type { CaseHubBucket, CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";

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

type BucketInput = Pick<Intervention, "status" | "paymentStatus">;

/** Catégorie patron — l'action à faire, pas un statut technique seul. */
export function bucketForIntervention(iv: BucketInput): CaseHubBucket {
  const s = iv.status ?? "pending";
  if (s === "pending" || s === "pending_needs_address") return "to_assign";
  if (s === "assigned" || s === "en_route" || s === "in_progress") return "in_progress";
  if (s === "waiting_material") return "waiting";
  if (s === "done") return "to_invoice";
  if (s === "invoiced") {
    return iv.paymentStatus === "paid" ? "paid" : "invoiced";
  }
  if (s === "cancelled") return "cancelled";
  return "all";
}

/** @deprecated — préférer bucketForIntervention (ignore le paiement). */
export function bucketForStatus(status: Intervention["status"] | undefined): CaseHubBucket {
  return bucketForIntervention({ status: status ?? "pending", paymentStatus: "unpaid" });
}

export type CaseHubTimeGroup =
  | "overdue"
  | "today"
  | "tomorrow"
  | "this_week"
  | "later"
  | "no_date"
  | "older";

const TIME_GROUP_ORDER: CaseHubTimeGroup[] = [
  "overdue",
  "today",
  "tomorrow",
  "this_week",
  "no_date",
  "later",
  "older",
];

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function parseInterventionScheduledDate(iv: Intervention): Date | null {
  const raw = (iv.scheduledDate ?? iv.requestedDate ?? "").trim();
  if (!raw) return null;
  const parsed = new Date(`${raw}T00:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/** Catégorise un dossier dans un bucket temporel pour le groupage de la file. */
export function timeGroupForIntervention(
  iv: Intervention,
  now: Date = new Date()
): CaseHubTimeGroup {
  const bucket = bucketForIntervention(iv);
  const historical = bucket === "invoiced" || bucket === "paid" || bucket === "cancelled";
  const scheduled = parseInterventionScheduledDate(iv);

  if (!scheduled) {
    return historical ? "older" : "no_date";
  }
  const today = startOfDay(now);
  const delta = diffDays(today, startOfDay(scheduled));
  if (delta < 0) return historical ? "older" : "overdue";
  if (delta === 0) return "today";
  if (delta === 1) return "tomorrow";
  if (delta <= 7) return "this_week";
  return "later";
}

/** Groupe les dossiers par temps, en gardant l'ordre interne fourni. */
export function groupInterventionsByTime(
  interventions: Intervention[],
  now: Date = new Date()
): { group: CaseHubTimeGroup; interventions: Intervention[] }[] {
  const map = new Map<CaseHubTimeGroup, Intervention[]>();
  for (const iv of interventions) {
    const group = timeGroupForIntervention(iv, now);
    const list = map.get(group);
    if (list) list.push(iv);
    else map.set(group, [iv]);
  }
  return TIME_GROUP_ORDER.flatMap((group) => {
    const list = map.get(group);
    return list && list.length > 0 ? [{ group, interventions: list }] : [];
  });
}

/** Plus c'est petit, plus c'est urgent. Sert de tri principal de la file. */
export const BUCKET_PRIORITY: Record<CaseHubBucket, number> = {
  to_assign: 0,
  waiting: 1,
  to_invoice: 2,
  in_progress: 3,
  invoiced: 4,
  paid: 5,
  cancelled: 6,
  all: 99,
};

function interventionSortTime(iv: Intervention): number {
  const raw = iv.statusUpdatedAt ?? iv.createdAt ?? null;
  const d = coerceFirestoreLikeDate(raw);
  return d ? d.getTime() : 0;
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
  }

  return { openCount, activeCount, weekCount };
}

export function filterCaseInterventionsByBucket(
  interventions: Intervention[],
  bucket: CaseHubBucket
): Intervention[] {
  if (bucket === "all") return interventions;
  return interventions.filter((iv) => bucketForIntervention(iv) === bucket);
}

export function countForBucket(interventions: Intervention[], bucket: CaseHubBucket): number {
  return filterCaseInterventionsByBucket(interventions, bucket).length;
}

/** Tri patron : urgence d'abord (bucket priority), puis date la plus récente. */
export function sortCaseInterventionsByUrgency(interventions: Intervention[]): Intervention[] {
  return [...interventions].sort((a, b) => {
    const ba = BUCKET_PRIORITY[bucketForIntervention(a)];
    const bb = BUCKET_PRIORITY[bucketForIntervention(b)];
    if (ba !== bb) return ba - bb;
    return interventionSortTime(b) - interventionSortTime(a);
  });
}

/** @deprecated — utiliser filterCaseInterventionsByBucket. */
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

/** @deprecated — utiliser countForBucket. */
export function countForCaseFilter(
  interventions: Intervention[],
  filter: CaseHubStatusFilter
): number {
  return filterCaseInterventions(interventions, filter).length;
}

/** @deprecated — utiliser sortCaseInterventionsByUrgency. */
export function sortCaseInterventions(interventions: Intervention[]): Intervention[] {
  return [...interventions].sort((a, b) => interventionSortTime(b) - interventionSortTime(a));
}
