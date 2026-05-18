"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  subscribeCommissionRuleAudit,
  subscribeCompanyCommissionAudit,
  type CommissionRuleAuditRow,
  type CompanyCommissionAuditRow,
} from "@/features/commissions/commissionFirestore";
import { formatCommissionAuditAt } from "@/features/commissions/formatCommissionAuditAt";

type Props = {
  companyId: string | null;
};

export default function CommissionHistoryPanel({ companyId }: Props) {
  const { t } = useTranslation();
  const [ruleRows, setRuleRows] = useState<CommissionRuleAuditRow[]>([]);
  const [interventionRows, setInterventionRows] = useState<CompanyCommissionAuditRow[]>([]);

  useEffect(() => {
    if (!companyId || !firestore) {
      setRuleRows([]);
      setInterventionRows([]);
      return () => {};
    }
    const unsubRules = subscribeCommissionRuleAudit(firestore, companyId, setRuleRows);
    const unsubIv = subscribeCompanyCommissionAudit(firestore, companyId, setInterventionRows);
    return () => {
      unsubRules();
      unsubIv();
    };
  }, [companyId]);

  const ruleActionLabel = (action: string) =>
    t(`commissions.dashboard.history.rule_action.${action}` as "commissions.dashboard.history.rule_action.created");

  const ivActionLabel = (action: string) =>
    t(`commissions.dashboard.history.iv_action.${action}` as "commissions.dashboard.history.iv_action.calculated");

  return (
    <div data-testid="commission-history-panel" className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {t("commissions.dashboard.history.rules_title")}
        </h3>
        {ruleRows.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="commission-rule-audit-empty">
            {t("commissions.dashboard.history.empty")}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="commission-rule-audit-list">
            {ruleRows.map((row) => (
              <li
                key={row.id}
                data-testid={`commission-rule-audit-${row.id}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {ruleActionLabel(row.action)}
                  </span>
                  <span className="text-xs text-slate-500">{formatCommissionAuditAt(row.at)}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  {t("commissions.dashboard.history.rule_id")}: {row.ruleId.slice(-8)}
                  {row.level ? ` · ${row.level}` : ""}
                  {row.value != null
                    ? ` · ${row.valueType === "percentage" ? `${row.value}%` : `${row.value} €`}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {t("commissions.dashboard.history.interventions_title")}
        </h3>
        {interventionRows.length === 0 ? (
          <p className="text-sm text-slate-500" data-testid="commission-iv-audit-empty">
            {t("commissions.dashboard.history.empty")}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="commission-iv-audit-list">
            {interventionRows.map((row) => (
              <li
                key={row.id}
                data-testid={`commission-iv-audit-${row.id}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {ivActionLabel(row.action)} — {row.finalCommissionAmount.toFixed(2)} €
                  </span>
                  <span className="text-xs text-slate-500">{formatCommissionAuditAt(row.at)}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  {t("commissions.dashboard.history.intervention_id")}:{" "}
                  {row.interventionId.slice(-8)}
                  {row.reason ? ` · ${row.reason}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
