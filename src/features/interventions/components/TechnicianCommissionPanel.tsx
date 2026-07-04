"use client";

import { ArrowDown, ArrowUp, Loader2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { formatPatronEuros } from "@/features/commissionsHub/commissionsHubFormat";
import type { PatronTrend } from "@/features/commissionsHub/commissionsHubPatronMetrics";
import { useTechnicianCommissionSummary } from "@/features/interventions/hooks/useTechnicianCommissionSummary";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians";

type Props = {
  technicianUid: string | null;
  interventions: Intervention[];
  technicians: Technician[];
};

function DeltaPill({ trend }: { trend: PatronTrend }) {
  const pct = trend.deltaPct;
  const tone = pct == null ? "neutral" : pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
  const Icon = tone === "up" ? ArrowUp : tone === "down" ? ArrowDown : Minus;
  const palette =
    tone === "up"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "down"
        ? "bg-rose-100 text-rose-800"
        : "bg-slate-100 text-slate-600";
  const label = pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct}%`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
        palette
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

/** Panneau gains terrain — lecture seule, palette hub commissions (compressé). */
export default function TechnicianCommissionPanel({
  technicianUid,
  interventions,
  technicians,
}: Props) {
  const { t } = useTranslation();
  const summary = useTechnicianCommissionSummary({
    technicianUid,
    interventions,
    technicians,
  });

  if (summary.companyPhase === "missing") {
    return (
      <div
        data-testid="technician-commission-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-[13px] text-amber-800"
      >
        {t("technician_hub.commission.company_required")}
      </div>
    );
  }

  if (summary.loading) {
    return (
      <div
        data-testid="technician-commission-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  const row = summary.row;
  const revenueCents = row?.monthRevenueCents ?? 0;
  const max = Math.max(1, ...summary.monthlySeries.map((p) => p.commissionCents));
  const lastIdx = summary.monthlySeries.length - 1;

  return (
    <div
      data-testid="technician-commission-panel"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3"
    >
      <div className="flex flex-col gap-1 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {t("technician_hub.commission.title")}
        </span>
        <span
          data-testid="technician-commission-display-name"
          className="truncate text-[13px] font-semibold text-slate-700"
        >
          {summary.displayName}
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-[20px] border border-sky-100/80 bg-gradient-to-b from-sky-50/80 to-white p-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700/80">
          {t("technician_hub.commission.revenue_label")}
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span
            data-testid="technician-commission-revenue"
            className="text-[26px] font-black leading-none tabular-nums text-slate-900"
          >
            {formatPatronEuros(revenueCents)}
          </span>
          <DeltaPill trend={summary.revenueTrend} />
        </div>
        {row && row.revenueMissionCount > 0 ? (
          <span className="text-[10px] font-medium text-slate-500">
            {t("technician_hub.commission.missions_meta")
              .replace("{{count}}", String(row.revenueMissionCount))
              .replace("{{revenue}}", formatPatronEuros(revenueCents))}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400">
            {t("technician_hub.commission.empty")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-[20px] border border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 to-white p-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">
          {t("technician_hub.commission.payable_label")}
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span
            data-testid="technician-commission-payable"
            className="text-[26px] font-black leading-none tabular-nums text-emerald-900"
          >
            {formatPatronEuros(summary.payableCents)}
          </span>
          <DeltaPill trend={summary.commissionTrend} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              summary.hasPersonalRule ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
            )}
          >
            {summary.rateLabel}
          </span>
          <span className="text-[10px] font-medium text-slate-500">
            {summary.hasPersonalRule
              ? t("technician_hub.commission.rate_personal")
              : t("technician_hub.commission.rate_inherited")}
          </span>
        </div>
        {row && row.manualBonusCents > 0 ? (
          <span className="text-[10px] font-semibold text-amber-700">
            {t("technician_hub.commission.bonus").replace(
              "{{amount}}",
              formatPatronEuros(row.manualBonusCents)
            )}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 rounded-[20px] border border-black/[0.06] bg-white/95 px-3 py-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.08)]">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("technician_hub.commission.sparkline_title")}
          </span>
          <span className="text-[10px] font-medium text-slate-500">
            {t("commissionsHub.sparkline.window").replace(
              "{{n}}",
              String(summary.monthlySeries.length)
            )}
          </span>
        </div>
        <div className="flex h-12 items-end gap-1 px-1" aria-hidden>
          {summary.monthlySeries.map((p, idx) => {
            const ratio = p.commissionCents / max;
            const barHeightPx = Math.max(4, Math.round(ratio * 44));
            const isCurrent = idx === lastIdx;
            return (
              <div key={p.monthKey} className="flex h-full flex-1 flex-col justify-end">
                <div
                  data-testid={`technician-commission-sparkline-bar-${p.monthKey}`}
                  className={cn(
                    "w-full rounded-t-md transition",
                    isCurrent
                      ? "bg-emerald-500"
                      : p.commissionCents > 0
                        ? "bg-emerald-200"
                        : "bg-slate-100"
                  )}
                  style={{ height: `${barHeightPx}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1">
          {summary.monthlySeries.map((p, idx) => {
            const isCurrent = idx === lastIdx;
            return (
              <span
                key={`${p.monthKey}-label`}
                className={cn(
                  "flex-1 text-center text-[8px] font-semibold uppercase tabular-nums",
                  isCurrent ? "text-emerald-700" : "text-slate-400"
                )}
              >
                {p.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
