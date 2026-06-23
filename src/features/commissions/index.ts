/**
 * API publique commissions — moteur règles, Firestore et dashboard techniciens.
 * UI hub patron → voir commissionsHub/.
 */
export {
  COMMISSION_AUDIT_COLLECTION,
  COMMISSION_OVERRIDES_COLLECTION,
  COMMISSION_RULE_AUDIT_COLLECTION,
  COMMISSION_RULES_COLLECTION,
  MANUAL_COMMISSIONS_COLLECTION,
  type CommissionAuditAction,
  type CommissionAuditRow,
  type CommissionRuleAuditAction,
  type CommissionRuleAuditRow,
  type CompanyCommissionAuditRow,
  type ManualCommissionEntry,
  appendCommissionAuditEntry,
  getInterventionCommission,
  saveCommissionOverride,
  subscribeCommissionAudit,
  subscribeCompanyCommissionAudit,
  subscribeInterventionCommission,
  createCommissionRule,
  deleteCommissionRule,
  subscribeCommissionRuleAudit,
  subscribeCommissionRules,
  updateCommissionRule,
  upsertTechnicianCommissionRule,
  createManualCommission,
  subscribeManualCommissions,
} from "@/features/commissions/commissionFirestore";
export type {
  CommissionLevel,
  CommissionValueType,
  CommissionRule,
  InterventionCommission,
} from "@/features/commissions/types";
export { formatCommissionAuditAt } from "@/features/commissions/formatCommissionAuditAt";
export { useCommissionRules } from "@/features/commissions/useCommissionRules";
export { CommissionDashboard } from "@/features/commissions/components/CommissionDashboard";
export { useCommissionDashboardController } from "@/features/commissions/hooks/useCommissionDashboardController";
export { default as InterventionCommissionPanel } from "@/features/commissions/components/InterventionCommissionPanel";
export { default as InterventionInvoiceAmountField } from "@/features/commissions/components/InterventionInvoiceAmountField";

// Modules consommés cross-feature (audit:barrels:public).
export * from "@/features/commissions/commissionDefaults";
export * from "@/features/commissions/commissionRuleMatching";
