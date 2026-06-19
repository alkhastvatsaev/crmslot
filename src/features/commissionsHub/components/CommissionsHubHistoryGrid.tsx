"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/core/config/firebase";
import {
  subscribeCommissionRuleAudit,
  subscribeCompanyCommissionAudit,
  type CommissionRuleAuditRow,
  type CompanyCommissionAuditRow,
} from "@/features/commissions/commissionFirestore";
import { formatCommissionAuditAt } from "@/features/commissions/formatCommissionAuditAt";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";

type Props = {
  companyId: string;
};

export default function CommissionsHubHistoryGrid({ companyId }: Props) {
  const { t } = useTranslation();
  const [ruleRows, setRuleRows] = useState<CommissionRuleAuditRow[]>([]);
  const [ivRows, setIvRows] = useState<CompanyCommissionAuditRow[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const unsubRules = subscribeCommissionRuleAudit(firestore, companyId, setRuleRows);
    const unsubIv = subscribeCompanyCommissionAudit(firestore, companyId, setIvRows);
    return () => {
      unsubRules();
      unsubIv();
    };
  }, [companyId]);

  const merged = [
    ...ruleRows.map((row) => ({
      id: `r-${row.id}`,
      label: t(
        `commissions.dashboard.history.rule_action.${row.action}` as "commissions.dashboard.history.rule_action.created"
      ),
      detail:
        row.value != null
          ? row.valueType === "percentage"
            ? `${row.value}%`
            : `${row.value} €`
          : row.ruleId.slice(-6),
      at: row.at,
      tone: "sky" as const,
    })),
    ...ivRows.map((row) => ({
      id: `i-${row.id}`,
      label: `${row.finalCommissionAmount.toFixed(0)} €`,
      detail: row.interventionId.slice(-6),
      at: row.at,
      tone: "amber" as const,
    })),
  ].sort((a, b) => String(b.at).localeCompare(String(a.at)));

  if (merged.length === 0) {
    return (
      <div
        data-testid="commissions-hub-history-empty"
        className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-400"
      >
        —
      </div>
    );
  }

  return (
    <div
      data-testid="commissions-hub-history-grid"
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3"
    >
      <ul className="space-y-2">
        {merged.map((row) => (
          <li
            key={row.id}
            data-testid={`commissions-hub-history-${row.id}`}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/90 px-3 py-2.5"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full",
                row.tone === "sky" ? "bg-sky-500" : "bg-amber-500"
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{row.label}</p>
              <p className="truncate text-[11px] text-slate-500">{row.detail}</p>
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
              {formatCommissionAuditAt(row.at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
