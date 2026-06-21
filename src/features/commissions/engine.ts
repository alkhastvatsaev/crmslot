import { CommissionRule, InterventionCommission } from "./types";
import { DEFAULT_COMMISSION_PERCENTAGE } from "@/features/commissions/commissionDefaults";

export interface CommissionContext {
  interventionId: string;
  technicianUid: string | null;
  groupId: string | null;
  baseAmount: number;
}

/**
 * Calcule la commission en appliquant la hiérarchie stricte d'Aslanbeck :
 * 1. Override manuel (déjà géré via InterventionCommission.isManualOverride, non calculé ici)
 * 2. Exception par intervention (priorité max)
 * 3. Exception par technicien
 * 4. Règle par groupe
 * 5. Aucune règle = taux par défaut app-level (DEFAULT_COMMISSION_PERCENTAGE)
 */
export function calculateCommission(
  context: CommissionContext,
  activeRules: CommissionRule[]
): Omit<
  InterventionCommission,
  "id" | "updatedAt" | "isManualOverride" | "overrideReason" | "overrideByUid"
> {
  const { interventionId, technicianUid, groupId, baseAmount } = context;

  // Chercher la règle avec la plus haute priorité
  const interventionRule = activeRules.find(
    (r) => r.level === "intervention" && r.targetId === interventionId
  );
  const technicianRule = activeRules.find(
    (r) => r.level === "technician" && r.targetId === technicianUid
  );
  const groupRule = activeRules.find((r) => r.level === "group" && r.targetId === groupId);

  const appliedRule = interventionRule || technicianRule || groupRule;

  let finalCommissionAmount = 0;

  if (appliedRule) {
    if (appliedRule.valueType === "percentage") {
      finalCommissionAmount = (baseAmount * appliedRule.value) / 100;
    } else if (appliedRule.valueType === "fixed_amount") {
      finalCommissionAmount = appliedRule.value;
    }
  } else {
    // Fallback : taux par défaut appliqué au montant de base.
    finalCommissionAmount = (baseAmount * DEFAULT_COMMISSION_PERCENTAGE) / 100;
  }

  return {
    interventionId,
    baseAmount,
    finalCommissionAmount,
    appliedRuleId: appliedRule ? appliedRule.id : null,
  };
}
