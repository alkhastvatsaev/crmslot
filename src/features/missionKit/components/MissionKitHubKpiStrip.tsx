"use client";

import { HardHat, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { MissionKitHubMetrics } from "@/features/missionKit/missionKitHubMetrics";

type Props = {
  metrics: MissionKitHubMetrics;
  className?: string;
};

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export default function MissionKitHubKpiStrip({ metrics, className }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="mission-kit-hub-kpi"
      className={cn(
        "grid shrink-0 grid-cols-2 gap-2 rounded-[16px] border border-slate-200/70 bg-white px-3 py-2.5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <PackageCheck className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {String(t("companyStock.mission_kit_kpi_complete"))}
          </p>
          <p
            data-testid="mission-kit-kpi-complete-pct"
            className="text-[15px] font-bold tabular-nums text-slate-900"
          >
            {metrics.completePct30d}%
            <span className="ml-1 text-[11px] font-semibold text-slate-500">
              {interpolate(String(t("companyStock.mission_kit_kpi_ratio")), {
                complete: metrics.complete30d,
                total: metrics.evaluated30d,
              })}
            </span>
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
            metrics.waitingMaterialJobs > 0
              ? "bg-amber-50 text-amber-800 ring-amber-100"
              : "bg-slate-50 text-slate-500 ring-slate-100"
          )}
        >
          <HardHat className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {String(t("companyStock.mission_kit_kpi_waiting"))}
          </p>
          <p
            data-testid="mission-kit-kpi-waiting"
            className="text-[15px] font-bold tabular-nums text-slate-900"
          >
            {metrics.waitingMaterialJobs}
          </p>
        </div>
      </div>
    </div>
  );
}
