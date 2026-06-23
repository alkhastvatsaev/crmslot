import type { ManualCommissionEntry } from "@/features/commissions";
import type { CommissionRule } from "@/features/commissions";
import type { Intervention } from "@/features/interventions";
import {
  interventionCommissionMonth,
  interventionTechnicianRevenueCents,
  manualEntryMonth,
  monthKeyFromDate,
} from "@/features/commissionsHub/commissionsHubPatronMonthKeys";
import type { PatronCommissionKpis } from "@/features/commissionsHub/commissionsHubPatronMetricsTypes";

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
