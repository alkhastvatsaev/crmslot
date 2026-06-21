import type { ManualCommissionEntry } from "@/features/commissions/commissionFirestore";
import type { CommissionRule, CommissionValueType } from "@/features/commissions/types";
import { pickPersonalTechnicianRule } from "@/features/commissions/commissionRuleMatching";
import { buildDefaultGroupCommissionRule } from "@/features/commissions/commissionDefaults";
import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians/types";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";

const TECHNICIAN_REVENUE_STATUSES: Intervention["status"][] = ["done", "invoiced"];

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
  alternateTargetIds: string[];
  monthEarnedCents: number;
  monthRevenueCents: number;
  revenueMissionCount: number;
  missionCount: number;
  manualBonusCents: number;
  personalRule: CommissionRule | null;
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

function interventionRevenueMonth(iv: Intervention): string | null {
  return (
    parseMonthKey(iv.completedAt) ??
    parseMonthKey(iv.invoicedAt) ??
    parseMonthKey(iv.paidAt) ??
    parseMonthKey(iv.createdAt)
  );
}

function interventionTechnicianRevenueCents(iv: Intervention): number {
  if (!(iv.assignedTechnicianUid ?? "").trim()) return 0;
  if (!TECHNICIAN_REVENUE_STATUSES.includes(iv.status)) return 0;
  const cents = interventionBillingTotalCents(iv);
  return cents > 0 ? cents : 0;
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

export function findPersonalTechnicianRule(
  rules: CommissionRule[],
  technicianUid: string,
  alternateTargetIds: string[] = []
): CommissionRule | null {
  return pickPersonalTechnicianRule(rules, technicianUid, alternateTargetIds);
}

export function resolveTechnicianDisplayRule(
  rules: CommissionRule[],
  companyId: string,
  technicianUid: string,
  alternateTargetIds: string[] = []
): {
  personalRule: CommissionRule | null;
  displayRule: CommissionRule | null;
  hasPersonalRule: boolean;
} {
  const personal = findPersonalTechnicianRule(rules, technicianUid, alternateTargetIds);
  if (personal) {
    return { personalRule: personal, displayRule: personal, hasPersonalRule: true };
  }
  const group =
    findCompanyGroupRule(rules, companyId) ?? buildDefaultGroupCommissionRule(companyId);
  return { personalRule: null, displayRule: group, hasPersonalRule: false };
}

export function formatRuleShort(rule: CommissionRule | null): string {
  if (!rule) return "—";
  return formatCommissionValue(rule.valueType, rule.value);
}

/** Montant de commission prévu à partir du CA ou du nombre de missions et du taux affiché. */
export function computeTechnicianCommissionPreviewCents(params: {
  revenueCents: number;
  revenueMissionCount: number;
  valueType: CommissionValueType;
  value: number;
}): number {
  const { revenueCents, revenueMissionCount, valueType, value } = params;
  if (value <= 0) return 0;

  if (valueType === "percentage") {
    if (revenueCents <= 0) return 0;
    return Math.round((revenueCents * value) / 100);
  }

  if (revenueMissionCount <= 0) return 0;
  return Math.round(value * 100 * revenueMissionCount);
}

export function resolveTechnicianRateValue(
  row: PatronTechnicianRow,
  pendingRateValue?: number
): { valueType: CommissionValueType; value: number } {
  const valueType = row.personalRule?.valueType ?? row.displayRule?.valueType ?? "percentage";
  const liveValue = Number(row.displayRule?.value ?? 0);
  const value = pendingRateValue ?? (Number.isFinite(liveValue) ? liveValue : 0);
  return { valueType, value };
}

/** Montant à payer ce mois : commission calculée (CA × taux) + bonus manuels. */
export function resolveTechnicianPayablePreviewCents(
  row: PatronTechnicianRow,
  pendingRateValue?: number
): number {
  const { valueType, value } = resolveTechnicianRateValue(row, pendingRateValue);
  const projected = computeTechnicianCommissionPreviewCents({
    revenueCents: row.monthRevenueCents,
    revenueMissionCount: row.revenueMissionCount,
    valueType,
    value,
  });
  return projected + row.manualBonusCents;
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
    monthRevenueCents += interventionTechnicianRevenueCents(iv);
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
    const commissionKey = interventionCommissionMonth(iv);
    if (commissionKey) {
      const idx = indexByKey.get(commissionKey);
      if (idx != null) {
        const cents = iv.commissionAmountCents ?? 0;
        if (cents > 0) points[idx]!.commissionCents += cents;
      }
    }

    const revenueKey = interventionRevenueMonth(iv);
    if (!revenueKey) continue;
    const revenueIdx = indexByKey.get(revenueKey);
    if (revenueIdx == null) continue;
    points[revenueIdx]!.revenueCents += interventionTechnicianRevenueCents(iv);
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
  technicians: Technician[];
  now?: Date;
}): PatronTechnicianRow[] {
  const now = params.now ?? new Date();
  const monthKey = monthKeyFromDate(now);

  const byUid = new Map<
    string,
    {
      name: string;
      initial: string;
      alternateTargetIds: string[];
      missionCents: number;
      missionCount: number;
      manualCents: number;
      revenueCents: number;
      revenueMissionCount: number;
    }
  >();

  const ensure = (
    uid: string,
    name: string,
    initial: string,
    alternateTargetIds: string[] = []
  ) => {
    const existing = byUid.get(uid);
    if (!existing) {
      byUid.set(uid, {
        name,
        initial,
        alternateTargetIds: [...new Set(alternateTargetIds.filter(Boolean))],
        missionCents: 0,
        missionCount: 0,
        manualCents: 0,
        revenueCents: 0,
        revenueMissionCount: 0,
      });
      return byUid.get(uid)!;
    }
    existing.alternateTargetIds = [
      ...new Set([...existing.alternateTargetIds, ...alternateTargetIds.filter(Boolean)]),
    ];
    return existing;
  };

  for (const tech of params.technicians) {
    if (canResolveTechnicianAssignUid(tech)) {
      const uid = resolveTechnicianAssignUid(tech);
      ensure(uid, tech.name, tech.initial, [tech.id]);
      continue;
    }
    const fallbackId = tech.id.trim();
    if (fallbackId) ensure(fallbackId, tech.name, tech.initial, []);
  }

  const assignUidByDocId = new Map(
    params.technicians
      .filter((tech) => canResolveTechnicianAssignUid(tech))
      .map((tech) => [tech.id.trim(), resolveTechnicianAssignUid(tech)] as const)
      .filter(([docId]) => Boolean(docId))
  );

  const resolveAssignedUid = (rawUid: string): string => {
    const trimmed = rawUid.trim();
    return assignUidByDocId.get(trimmed) ?? trimmed;
  };

  for (const iv of params.interventions) {
    if (interventionCommissionMonth(iv) !== monthKey) continue;
    const uid = resolveAssignedUid(iv.assignedTechnicianUid ?? "");
    if (!uid) continue;
    const cents = iv.commissionAmountCents ?? 0;
    if (cents <= 0) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.missionCents += cents;
    row.missionCount += 1;
  }

  for (const iv of params.interventions) {
    if (interventionRevenueMonth(iv) !== monthKey) continue;
    const uid = resolveAssignedUid(iv.assignedTechnicianUid ?? "");
    if (!uid) continue;
    const revenueCents = interventionTechnicianRevenueCents(iv);
    if (revenueCents <= 0) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.revenueCents += revenueCents;
    row.revenueMissionCount += 1;
  }

  for (const entry of params.manualEntries) {
    if (manualEntryMonth(entry) !== monthKey) continue;
    const uid = resolveAssignedUid(entry.technicianUid);
    if (!uid) continue;
    const row = ensure(uid, uid.slice(-6), uid.slice(0, 1).toUpperCase());
    row.manualCents += Math.round(entry.amountEuros * 100);
  }

  return [...byUid.entries()]
    .map(([uid, row]) => {
      const { personalRule, displayRule, hasPersonalRule } = resolveTechnicianDisplayRule(
        params.rules,
        params.companyId,
        uid,
        row.alternateTargetIds
      );
      return {
        uid,
        name: row.name,
        initial: row.initial,
        alternateTargetIds: row.alternateTargetIds,
        monthEarnedCents: row.missionCents + row.manualCents,
        monthRevenueCents: row.revenueCents,
        revenueMissionCount: row.revenueMissionCount,
        missionCount: row.missionCount,
        manualBonusCents: row.manualCents,
        personalRule,
        displayRule,
        hasPersonalRule,
      };
    })
    .sort((a, b) => b.monthEarnedCents - a.monthEarnedCents);
}
