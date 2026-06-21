import type { CommissionRule } from "@/features/commissions/types";

/** Taux de commission par défaut appliqué à tous les techniciens si aucune règle n'existe. */
export const DEFAULT_COMMISSION_PERCENTAGE = 20;

/** Identifiant sentinel pour la règle synthétique (jamais persistée en base). */
export const DEFAULT_COMMISSION_RULE_ID = "__default__";

/**
 * Règle de groupe synthétique 20% — utilisée comme fallback d'affichage et de calcul
 * tant que le patron n'a pas créé sa propre règle. N'est jamais écrite en Firestore.
 */
export function buildDefaultGroupCommissionRule(companyId: string): CommissionRule {
  return {
    id: DEFAULT_COMMISSION_RULE_ID,
    companyId,
    level: "group",
    targetId: companyId,
    valueType: "percentage",
    value: DEFAULT_COMMISSION_PERCENTAGE,
    isActive: true,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
    createdByUid: "__system__",
  };
}

export function isDefaultCommissionRule(rule: CommissionRule | null | undefined): boolean {
  return Boolean(rule && rule.id === DEFAULT_COMMISSION_RULE_ID);
}
