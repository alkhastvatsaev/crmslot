import type { ManualCommissionEntry } from "@/features/commissions/commissionFirestore";
import type { CommissionRule } from "@/features/commissions/types";
import type { Intervention } from "@/features/interventions/types";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";

export type PatronCommissionKpis = {
  monthTotalCents: number;
  monthMissionCents: number;
  monthManualCents: number;
  monthRevenueCents: number;
  activeTechnicianCount: number;
  exceptionRuleCount: number;
};

export type PatronMonthlyPoint = {
  monthKey: string;
  label: string;
  commissionCents: number;
  revenueCents: number;
};

export type PatronTrend = {
  currentCents: number;
  previousCents: number;
  deltaPct: number | null;
};

export type PatronTechnicianRow = {
  uid: string;
  name: string;
  initial: string;
  monthEarnedCents: number;
  missionCount: number;
  manualBonusCents: number;
  displayRule: CommissionRule | null;
  hasPersonalRule: boolean;
};

function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 7);
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return null;
    return monthKeyFromDate(new Date(t));
  }

  const d = coerceFirestoreLikeDate(value);
  return d ? monthKeyFromDate(d) : null;
}

function interventionCommissionMonth(iv: Intervention): string | null {
  return (
    parseMonthKey(iv.invoicedAt) ??
    parseMonthKey(iv.paidAt) ??
    parseMonthKey(iv.completedAt) ??
    parseMonthKey(iv.createdAt)
  );
}

function manualEntryMonth(entry: ManualCommissionEntry): string | null {
  return parseMonthKey(entry.date);
}

export function findCompanyGroupRule(
  rules: CommissionRule[],
  companyId: string
): CommissionRule | null {
  return rules.find((r) => r.level === "group" && r.targetId === companyId) ?? null;
}

export function resolveTechnicianDisplayRule(
  rules: CommissionRule[],
  companyId: string,
  technicianUid: string
): { rule: CommissionRule | null; hasPersonalRule: boolean } {
  const personal = rules.find((r) => r.level === "technician" && r.targetId === technicianUid);
  if (personal) return { rule: personal, hasPersonalRule: true };
  const group = findCompanyGroupRule(rules, companyId);
  return { rule: group, hasPersonalRule: false };
}

export function formatRuleShort(rule: CommissionRule | null): string {
  if (!rule) return "—";
  return formatCommissionValue(rule.valueType, rule.value);
}

export function buildPatronCommissionKpis(params: {
  interventions: Intervention[];
  manualEntries: ManualCommissionEntry[];
  rules: CommissionRule[];
  now?: Date;
}): PatronCommissionKpis {
  const now = params.now ?? new Date();
  const monthKey = monthKeyFromDate(now);

  let monthMissionCents = 0;
  let monthRevenueCents = 0;
  const techWithMission = new Set<string>();

  for (const iv of params.interventions) {
    if (interventionCommissionMonth(iv) !== monthKey) continue;
    const revenue = iv.invoiceAmountCents ?? 0;
    if (revenue > 0) monthRevenueCents += revenue;
    const cents = iv.commissionAmountCents ?? 0;
    if (cents <= 0) continue;
    monthMissionCents += cents;
    const uid = (iv.assignedTechnicianUid ?? "").trim();
    if (uid) techWithMission.add(uid);
  }

  let monthManualCents = 0;
  const techWithManual = new Set<string>();
  for (const entry of params.manualEntries) {
    if (manualEntryMonth(entry) !== monthKey) continue;
    const cents = Math.round(entry.amountEuros * 100);
    monthManualCents += cents;
    techWithManual.add(entry.technicianUid.trim());
  }

  const activeTechnicianCount = new Set([...techWithMission, ...techWithManual]).size;
  const exceptionRuleCount = params.rules.filter(
    (r) => r.level === "technician" || r.level === "intervention"
  ).length;

  return {
    monthMissionCents,
    monthManualCents,
    monthTotalCents: monthMissionCents + monthManualCents,
    monthRevenueCents,
    activeTechnicianCount,
    exceptionRuleCount,
  };
}

const MONTH_SHORT_FR = [
  "jan",
  "fév",
  "mar",
  "avr",
  "mai",
  "juin",
  "juil",
  "août",
  "sep",
  "oct",
  "nov",
  "déc",
];

export function buildPatronMonthlySeries(params: {
  interventions: Intervention[];
  manualEntries: ManualCommissionEntry[];
  now?: Date;
  months?: number;
}): PatronMonthlyPoint[] {
  const now = params.now ?? new Date();
  const months = params.months ?? 6;

  const points: PatronMonthlyPoint[] = [];
  const indexByKey = new Map<string, number>();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKeyFromDate(d);
    indexByKey.set(key, points.length);
    points.push({
      monthKey: key,
      label: MONTH_SHORT_FR[d.getMonth()] ?? key,
      commissionCents: 0,
      revenueCents: 0,
    });
  }

  for (const iv of params.interventions) {
    const key = interventionCommissionMonth(iv);
    if (!key) continue;
    const idx = indexByKey.get(key);
    if (idx == null) continue;
    const cents = iv.commissionAmountCents ?? 0;
    if (cents > 0) points[idx]!.commissionCents += cents;
    const revenue = iv.invoiceAmountCents ?? 0;
    if (revenue > 0) points[idx]!.revenueCents += revenue;
  }

  for (const entry of params.manualEntries) {
    const key = manualEntryMonth(entry);
    if (!key) continue;
    const idx = indexByKey.get(key);
    if (idx == null) continue;
    points[idx]!.commissionCents += Math.round(entry.amountEuros * 100);
  }

  return points;
}

export function buildPatronTrend(
  series: PatronMonthlyPoint[],
  field: "commissionCents" | "revenueCents"
): PatronTrend {
  if (series.length === 0) return { currentCents: 0, previousCents: 0, deltaPct: null };
  const current = series[series.length - 1]![field];
  const previous = series.length >= 2 ? series[series.length - 2]![field] : 0;
  if (previous === 0) {
    return { currentCents: current, previousCents: 0, deltaPct: current > 0 ? null : 0 };
  }
  const deltaPct = Math.round(((current - previous) / previous) * 100);
  return { currentCents: current, previousCents: previous, deltaPct };
}

export function buildPatronTechnicianRows(params: {
  interventions: Intervention[];
  manualEntries: ManualCommissionEntry[];
  rules: CommissionRule[];
  companyId: string;
  technicians: { id: string; name: string; initial: string; authUid?: string | null }[];
  now?: Date;
}): PatronTechnicianRow[] {
  const now = params.now ?? new Date();
  const monthKey = monthKeyFromDate(now);

  const byUid = new Map<
    string,
    {
      name: string;
      initial: string;
      missionCents: number;
      missionCount: number;
      manualCents: number;
    }
  >();

  const ensure = (uid: string, name: string, initial: string) => {
    if (!byUid.has(uid)) {
      byUid.set(uid, { name, initial, missionCents: 0, missionCount: 0, manualCents: 0 });
    }
    return byUid.get(uid)!;
  };

  for (const tech of params.technicians) {
    const uid = (tech.authUid ?? tech.id).trim();
    if (!uid) continue;
    ensure(uid, tech.name, tech.initial);
  }

  for (const iv of params.interventions) {
    if (interventionCommissionMonth(iv) !== monthKey) continue;
    const uid = (iv.assignedTechnicianUid ?? "").trim();
    if (!uid) continue;
    const cents = iv.commissionAmountCents ?? 0;
    if (cents <= 0) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.missionCents += cents;
    row.missionCount += 1;
  }

  for (const entry of params.manualEntries) {
    if (manualEntryMonth(entry) !== monthKey) continue;
    const uid = entry.technicianUid.trim();
    if (!uid) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.manualCents += Math.round(entry.amountEuros * 100);
  }

  return [...byUid.entries()]
    .map(([uid, row]) => {
      const { rule, hasPersonalRule } = resolveTechnicianDisplayRule(
        params.rules,
        params.companyId,
        uid
      );
      return {
        uid,
        name: row.name,
        initial: row.initial,
        monthEarnedCents: row.missionCents + row.manualCents,
        missionCount: row.missionCount,
        manualBonusCents: row.manualCents,
        displayRule: rule,
        hasPersonalRule,
      };
    })
    .sort((a, b) => b.monthEarnedCents - a.monthEarnedCents);
}
