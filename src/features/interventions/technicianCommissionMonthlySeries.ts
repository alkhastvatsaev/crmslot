import type { CommissionValueType } from "@/features/commissions";
import type { ManualCommissionEntry } from "@/features/commissions";
import {
  buildPatronMonthlySeries,
  computeTechnicianCommissionPreviewCents,
  type PatronMonthlyPoint,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import {
  interventionRevenueMonth,
  interventionTechnicianRevenueCents,
  manualEntryMonth,
} from "@/features/commissionsHub/commissionsHubPatronMonthKeys";
import type { Intervention } from "@/features/interventions/types";

function countRevenueMissionsByMonth(interventions: Intervention[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const iv of interventions) {
    const monthKey = interventionRevenueMonth(iv);
    if (!monthKey) continue;
    if (interventionTechnicianRevenueCents(iv) <= 0) continue;
    counts.set(monthKey, (counts.get(monthKey) ?? 0) + 1);
  }
  return counts;
}

function manualBonusCentsByMonth(entries: ManualCommissionEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const monthKey = manualEntryMonth(entry);
    if (!monthKey) continue;
    totals.set(monthKey, (totals.get(monthKey) ?? 0) + Math.round(entry.amountEuros * 100));
  }
  return totals;
}

/** Série 6 mois alignée sur « À percevoir » : CA × taux + bonus manuels. */
export function buildTechnicianGainsMonthlySeries(params: {
  interventions: Intervention[];
  manualEntries: ManualCommissionEntry[];
  valueType: CommissionValueType;
  value: number;
  months?: number;
  now?: Date;
}): PatronMonthlyPoint[] {
  const base = buildPatronMonthlySeries({
    interventions: params.interventions,
    manualEntries: params.manualEntries,
    months: params.months,
    now: params.now,
  });

  const revenueMissionsByMonth = countRevenueMissionsByMonth(params.interventions);
  const manualByMonth = manualBonusCentsByMonth(params.manualEntries);

  return base.map((point) => {
    const manualBonusCents = manualByMonth.get(point.monthKey) ?? 0;
    const projectedCents = computeTechnicianCommissionPreviewCents({
      revenueCents: point.revenueCents,
      revenueMissionCount: revenueMissionsByMonth.get(point.monthKey) ?? 0,
      valueType: params.valueType,
      value: params.value,
    });

    return {
      ...point,
      commissionCents: projectedCents + manualBonusCents,
    };
  });
}
