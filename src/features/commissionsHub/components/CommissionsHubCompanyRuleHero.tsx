"use client";

import { Building2, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CommissionRule } from "@/features/commissions/types";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";

type Props = {
  rule: CommissionRule | null;
  onEdit: () => void;
  onCreate: () => void;
};

/** Règle société par défaut — le patron veut la voir sans chercher. */
export default function CommissionsHubCompanyRuleHero({ rule, onEdit, onCreate }: Props) {
  const { t } = useTranslation();

  if (!rule) {
    return (
      <button
        type="button"
        data-testid="commissions-hub-company-rule-create"
        onClick={onCreate}
        className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center justify-between gap-3 rounded-[22px] border border-dashed border-sky-300 bg-sky-50/90 px-4 py-3 text-left transition hover:bg-sky-50"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
            <Plus className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-sky-900">
              {t("commissionsHub.company_rule.empty")}
            </p>
            <p className="text-[11px] text-sky-700/80">
              {t("commissionsHub.company_rule.empty_hint")}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-sky-400" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="commissions-hub-company-rule-hero"
      onClick={onEdit}
      className={cn(
        "mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center justify-between gap-3 rounded-[22px] border border-sky-200/80 bg-gradient-to-r from-sky-50 to-white px-4 py-3 text-left shadow-[0_8px_24px_-12px_rgba(14,116,144,0.25)] transition hover:scale-[1.01] active:scale-[0.99]"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600/90">
            {t("commissionsHub.company_rule.label")}
          </p>
          <p className="truncate text-sm font-medium text-slate-700">
            {t("commissionsHub.company_rule.applies_all")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-2xl font-bold tabular-nums text-slate-900">
          {formatCommissionValue(rule.valueType, rule.value)}
        </span>
        <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden />
      </div>
    </button>
  );
}
