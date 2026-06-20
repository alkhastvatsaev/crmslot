"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommissionValueType } from "@/features/commissions/types";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetrics";
import { formatCommissionValue } from "@/features/commissionsHub/commissionsHubFormat";
import { logger } from "@/core/logger";

type Props = {
  technicianRows: PatronTechnicianRow[];
  selectedUid: string | null;
  pendingRateByUid: Record<string, number>;
  onPendingRateChange: (uid: string, value: number) => void;
  onPendingRateClear: (uid: string) => void;
  onSelectTech: (uid: string) => void;
  onSaveRate: (input: {
    technicianUid: string;
    alternateTargetIds: string[];
    valueType: CommissionValueType;
    value: number;
  }) => Promise<boolean>;
};

const PCT_STEP = 1;

export default function CommissionsHubTechRatesList({
  technicianRows,
  selectedUid,
  pendingRateByUid,
  onPendingRateChange,
  onPendingRateClear,
  onSelectTech,
  onSaveRate,
}: Props) {
  const [saveErrorUid, setSaveErrorUid] = useState<string | null>(null);
  const sorted = [...technicianRows].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    for (const row of technicianRows) {
      const target = pendingRateByUid[row.uid];
      if (target == null) continue;
      const persisted = Number(row.personalRule?.value ?? row.displayRule?.value ?? NaN);
      if (Number.isFinite(persisted) && Math.abs(persisted - target) < 0.001) {
        onPendingRateClear(row.uid);
      }
    }
  }, [technicianRows, pendingRateByUid, onPendingRateClear]);

  const handleStep = (row: PatronTechnicianRow, delta: number) => {
    const liveValue = Number(row.displayRule?.value ?? 0);
    const current = pendingRateByUid[row.uid] ?? (Number.isFinite(liveValue) ? liveValue : 0);
    const valueType: CommissionValueType =
      row.personalRule?.valueType ?? row.displayRule?.valueType ?? "percentage";
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    if (next === current) return;

    onPendingRateChange(row.uid, next);
    setSaveErrorUid(null);

    void onSaveRate({
      technicianUid: row.uid,
      alternateTargetIds: row.alternateTargetIds,
      valueType,
      value: next,
    }).then((ok) => {
      if (ok) return;
      logger.warn("[CommissionsHubTechRatesList] save rejected", { uid: row.uid });
      onPendingRateClear(row.uid);
      setSaveErrorUid(row.uid);
    });
  };

  if (sorted.length === 0) return null;

  return (
    <ul data-testid="commissions-hub-tech-rates" className="flex flex-col gap-1">
      {sorted.map((row) => {
        const active = selectedUid === row.uid;
        const optimistic = pendingRateByUid[row.uid];
        const liveValue = Number(row.displayRule?.value ?? 0);
        const value = optimistic ?? (Number.isFinite(liveValue) ? liveValue : 0);
        const valueType: CommissionValueType =
          row.personalRule?.valueType ?? row.displayRule?.valueType ?? "percentage";

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
                <span className="truncate text-[12px] font-semibold text-slate-800">
                  {row.name}
                </span>
              </button>

              <button
                type="button"
                aria-label="−"
                data-testid={`commissions-hub-tech-rate-minus-${row.uid}`}
                onClick={() => handleStep(row, -PCT_STEP)}
                disabled={value <= 0}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>

              <span
                data-testid={`commissions-hub-tech-rate-value-${row.uid}`}
                className="min-w-[44px] text-center text-[13px] font-bold tabular-nums text-slate-900"
              >
                {formatCommissionValue(valueType, value)}
              </span>

              <button
                type="button"
                aria-label="+"
                data-testid={`commissions-hub-tech-rate-plus-${row.uid}`}
                onClick={() => handleStep(row, PCT_STEP)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            {saveErrorUid === row.uid ? (
              <p
                data-testid={`commissions-hub-tech-rate-error-${row.uid}`}
                className="px-2 pb-1 text-[10px] font-medium text-rose-600"
              >
                Enregistrement refusé — réessayez ou vérifiez vos droits société.
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
