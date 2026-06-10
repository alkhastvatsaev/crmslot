"use client";

import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  STOCK_HEALTH_DOT,
  STOCK_HEALTH_TEXT,
  STOCK_PULSE_SEGMENT,
  STOCK_SIGNAL,
  stockPulseRingGradient,
} from "@/features/featureHub/companyStockVisualTheme";
import type { CompanyStockDashboardMetrics } from "@/features/featureHub/companyStockMetrics";

type Props = {
  metrics: CompanyStockDashboardMetrics;
};

/** Bandeau d'état — proportions visuelles, palette équilibrée. */
export default function CompanyStockPulseBar({ metrics }: Props) {
  const { t } = useTranslation();
  const total = Math.max(metrics.totalSkus, 1);
  const okPct = (metrics.okCount / total) * 100;
  const lowPct = (metrics.lowCount / total) * 100;
  const outPct = (metrics.outCount / total) * 100;
  const urgent = metrics.outCount + metrics.lowCount;

  return (
    <div
      data-testid="company-stock-pulse"
      className="shrink-0 rounded-[16px] border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/60 px-3 py-3"
      aria-label={String(t("companyStock.pulse_aria"))}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full p-[3px]",
            urgent === 0 && "bg-teal-100/50 ring-1 ring-teal-200/60"
          )}
          style={urgent > 0 ? { background: stockPulseRingGradient(outPct, lowPct) } : undefined}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white shadow-sm shadow-slate-900/[0.04]">
            <span
              data-testid="company-stock-kpi-coverage"
              className="text-[15px] font-bold leading-none tabular-nums text-slate-800"
            >
              {metrics.coveragePct}
            </span>
            <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
              %
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-slate-100/90"
            role="img"
            aria-label={`${metrics.okCount} OK, ${metrics.lowCount} bas, ${metrics.outCount} rupture`}
          >
            {okPct > 0 ? (
              <div className={STOCK_PULSE_SEGMENT.ok} style={{ width: `${okPct}%` }} />
            ) : null}
            {lowPct > 0 ? (
              <div className={STOCK_PULSE_SEGMENT.low} style={{ width: `${lowPct}%` }} />
            ) : null}
            {outPct > 0 ? (
              <div className={STOCK_PULSE_SEGMENT.out} style={{ width: `${outPct}%` }} />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold tabular-nums">
            {metrics.outCount > 0 ? (
              <span
                className={cn("inline-flex items-center gap-1", STOCK_HEALTH_TEXT.out)}
                data-testid="company-stock-kpi-out"
              >
                <span className={cn("h-2 w-2 rounded-full", STOCK_HEALTH_DOT.out)} aria-hidden />
                {metrics.outCount}
              </span>
            ) : null}
            {metrics.lowCount > 0 ? (
              <span
                className={cn("inline-flex items-center gap-1", STOCK_HEALTH_TEXT.low)}
                data-testid="company-stock-kpi-low"
              >
                <span className={cn("h-2 w-2 rounded-full", STOCK_HEALTH_DOT.low)} aria-hidden />
                {metrics.lowCount}
              </span>
            ) : null}
            {metrics.okCount > 0 && urgent > 0 ? (
              <span className={cn("inline-flex items-center gap-1", STOCK_HEALTH_TEXT.ok)}>
                <span className={cn("h-2 w-2 rounded-full", STOCK_HEALTH_DOT.ok)} aria-hidden />
                {metrics.okCount}
              </span>
            ) : null}
            {urgent === 0 ? (
              <span className={STOCK_HEALTH_TEXT.ok} data-testid="company-stock-kpi-ok">
                {t("companyStock.pulse_all_ok")}
              </span>
            ) : null}
          </div>
        </div>

        {metrics.waitingMaterialJobs > 0 ? (
          <div className="flex shrink-0 flex-col gap-1.5">
            <span
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-[12px] border",
                STOCK_SIGNAL.jobs
              )}
              title={String(t("companyStock.kpi_jobs_waiting"))}
              data-testid="company-stock-signal-jobs"
            >
              <HardHat className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">{metrics.waitingMaterialJobs}</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
