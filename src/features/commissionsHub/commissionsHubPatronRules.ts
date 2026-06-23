import type { CommissionRule, CommissionValueType } from "@/features/commissions/types";
import { pickPersonalTechnicianRule } from "@/features/commissions/commissionRuleMatching";
import { buildDefaultGroupCommissionRule } from "@/features/commissions/commissionDefaults";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetricsTypes";

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
