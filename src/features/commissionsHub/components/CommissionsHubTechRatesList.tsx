"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CommissionRule, CommissionValueType } from "@/features/commissions/types";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetrics";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";

type Props = {
  technicianRows: PatronTechnicianRow[];
  selectedUid: string | null;
  saving: boolean;
  onSelectTech: (uid: string) => void;
  onSaveRate: (input: {
    technicianUid: string;
    editingRuleId: string | null;
    valueType: CommissionValueType;
    value: number;
  }) => Promise<boolean>;
  onResetRate: (rule: CommissionRule) => Promise<void>;
};

const PCT_STEP = 1; // 1% per click — finer tuning lives in focused editor.

/** Liste plate techniciens — taux modifiable en 1 clic via stepper. */
export default function CommissionsHubTechRatesList({
  technicianRows,
  selectedUid,
  saving,
  onSelectTech,
  onSaveRate,
  onResetRate,
}: Props) {
  const { t } = useTranslation();
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  const sorted = [...technicianRows].sort((a, b) => a.name.localeCompare(b.name));

  const handleStep = async (row: PatronTechnicianRow, delta: number) => {
    if (!row.displayRule) return;
    const current = row.displayRule.value;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    if (next === current) return;
    setPendingUid(row.uid);
    try {
      await onSaveRate({
        technicianUid: row.uid,
        editingRuleId: row.hasPersonalRule ? row.displayRule.id : null,
        valueType: row.displayRule.valueType,
        value: next,
      });
    } finally {
      setPendingUid(null);
    }
  };

  const handleReset = async (row: PatronTechnicianRow) => {
    if (!row.hasPersonalRule || !row.displayRule) return;
    setPendingUid(row.uid);
    try {
      await onResetRate(row.displayRule);
    } finally {
      setPendingUid(null);
    }
  };

  if (sorted.length === 0) return null;

  return (
    <div
      data-testid="commissions-hub-tech-rates"
      className="flex flex-col gap-2 rounded-[24px] border border-black/[0.06] bg-white/95 p-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {t("commissionsHub.tech_rates.title")}
        </span>
        <span className="text-[10px] font-medium text-slate-500">{sorted.length}</span>
      </div>

      <ul className="flex flex-col gap-1">
        {sorted.map((row) => {
          const active = selectedUid === row.uid;
          const isPending = pendingUid === row.uid;
          const value = row.displayRule?.value ?? 0;
          const valueType: CommissionValueType = row.displayRule?.valueType ?? "percentage";
          const disabledStep = saving || isPending;

          return (
            <li key={row.uid}>
              <div
                data-testid={`commissions-hub-tech-rate-row-${row.uid}`}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-2 py-1.5 transition",
                  active
                    ? "border-slate-900 bg-white ring-2 ring-slate-900/10"
                    : "border-black/[0.06] bg-white hover:border-slate-300"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectTech(row.uid)}
                  className="flex flex-1 items-center gap-2 truncate text-left"
                  data-testid={`commissions-hub-tech-rate-focus-${row.uid}`}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {row.initial}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[12px] font-semibold text-slate-800">
                      {row.name}
                    </span>
                    <span
                      className={cn(
                        "truncate text-[10px] font-semibold uppercase tracking-wide",
                        row.hasPersonalRule ? "text-violet-600" : "text-sky-600"
                      )}
                    >
                      {row.hasPersonalRule
                        ? t("commissionsHub.tech_rates.personal")
                        : t("commissionsHub.tech_rates.inherited")}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="−"
                  data-testid={`commissions-hub-tech-rate-minus-${row.uid}`}
                  onClick={() => void handleStep(row, -PCT_STEP)}
                  disabled={disabledStep || value <= 0}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>

                <span
                  data-testid={`commissions-hub-tech-rate-value-${row.uid}`}
                  className={cn(
                    "min-w-[44px] text-center text-[13px] font-bold tabular-nums",
                    row.hasPersonalRule ? "text-violet-700" : "text-sky-700"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-slate-400" />
                  ) : (
                    formatCommissionValue(valueType, value)
                  )}
                </span>

                <button
                  type="button"
                  aria-label="+"
                  data-testid={`commissions-hub-tech-rate-plus-${row.uid}`}
                  onClick={() => void handleStep(row, PCT_STEP)}
                  disabled={disabledStep}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>

                {row.hasPersonalRule ? (
                  <button
                    type="button"
                    aria-label={t("commissionsHub.tech_rates.reset")}
                    data-testid={`commissions-hub-tech-rate-reset-${row.uid}`}
                    onClick={() => void handleReset(row)}
                    disabled={disabledStep}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : (
                  <span className="h-8 w-8 shrink-0" aria-hidden />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
