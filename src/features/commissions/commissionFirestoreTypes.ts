import type { CommissionRule } from "./types";

export const COMMISSION_RULES_COLLECTION = "commission_rules";
export const COMMISSION_OVERRIDES_COLLECTION = "commission_overrides";
export const COMMISSION_AUDIT_COLLECTION = "commission_audit";
export const COMMISSION_RULE_AUDIT_COLLECTION = "commission_rule_audit";
export const MANUAL_COMMISSIONS_COLLECTION = "manual_commissions";

export type CommissionRuleAuditAction = "created" | "updated" | "deactivated";

export type CommissionRuleAuditRow = {
  id: string;
  companyId: string;
  ruleId: string;
  action: CommissionRuleAuditAction;
  level?: string;
  targetId?: string;
  valueType?: string;
  value?: number;
  byUid: string;
  at: unknown;
};

export type CompanyCommissionAuditRow = CommissionAuditRow & {
  companyId: string;
};

export type ManualCommissionEntry = {
  id: string;
  technicianUid: string;
  amountEuros: number;
  reason: string;
  date: string;
  createdByUid: string;
  createdAt: unknown;
};

export type CommissionAuditRow = {
  id: string;
  interventionId: string;
  action: string;
  finalCommissionAmount: number;
  reason?: string;
  byUid: string;
  at: unknown;
};

export type CommissionAuditAction = "calculated" | "override";

export type CommissionRuleSnapshot = Pick<
  CommissionRule,
  "level" | "targetId" | "valueType" | "value"
>;
