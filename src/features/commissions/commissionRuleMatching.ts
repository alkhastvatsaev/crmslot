import type { CommissionRule } from "@/features/commissions/types";

export function coerceCommissionRuleValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCommissionRule(rule: CommissionRule): CommissionRule {
  return {
    ...rule,
    value: coerceCommissionRuleValue(rule.value),
    targetId: (rule.targetId ?? "").trim(),
  };
}

export function matchPersonalTechnicianRules(
  rules: CommissionRule[],
  technicianUid: string,
  alternateTargetIds: string[] = []
): CommissionRule[] {
  const ids = new Set(
    [technicianUid, ...alternateTargetIds].map((id) => id.trim()).filter(Boolean)
  );
  return rules
    .filter((r) => r.level === "technician" && ids.has((r.targetId ?? "").trim()))
    .map(normalizeCommissionRule);
}

export function pickPersonalTechnicianRule(
  rules: CommissionRule[],
  technicianUid: string,
  alternateTargetIds: string[] = []
): CommissionRule | null {
  const primary = technicianUid.trim();
  const matches = matchPersonalTechnicianRules(rules, primary, alternateTargetIds);
  if (matches.length === 0) return null;

  const primaryMatch = matches.find((r) => r.targetId === primary);
  if (primaryMatch) return primaryMatch;

  return (
    [...matches].sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    )[0] ?? null
  );
}
