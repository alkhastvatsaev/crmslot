import type { ManualCommissionEntry } from "@/features/commissions";
import type { Intervention } from "@/features/interventions";
import {
  interventionCommissionMonth,
  interventionRevenueMonth,
  interventionTechnicianRevenueCents,
  manualEntryMonth,
  monthKeyFromDate,
} from "@/features/commissionsHub/commissionsHubPatronMonthKeys";
import type {
  PatronMonthlyPoint,
  PatronTrend,
} from "@/features/commissionsHub/commissionsHubPatronMetricsTypes";

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
