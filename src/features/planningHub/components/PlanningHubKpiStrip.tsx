"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { PlanningHubKpis } from "@/features/planningHub/planningHubPatronMetrics";

type Props = {
  kpis: PlanningHubKpis;
  className?: string;
};

export default function PlanningHubKpiStrip({ kpis, className }: Props) {
  const { t } = useTranslation();

  const items = [
    {
      testId: "planning-hub-kpi-missions",
      value: String(kpis.missionsToday),
      label: t("planningHub.kpi.missions"),
      accent: "text-slate-900",
    },
    {
      testId: "planning-hub-kpi-conflicts",
      value: String(kpis.conflictCount),
      label: t("planningHub.kpi.conflicts"),
      accent: "text-red-700",
    },
    {
      testId: "planning-hub-kpi-unassigned",
      value: String(kpis.unassignedToday),
      label: t("planningHub.kpi.unassigned"),
      accent: "text-amber-700",
    },
  ];

  return (
    <div
      data-testid="planning-hub-kpi-strip"
      className={cn(
        "grid shrink-0 grid-cols-3 gap-2 border-b border-black/[0.05] bg-gradient-to-b from-white/90 to-white/50 px-3 py-3",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.testId}
          data-testid={item.testId}
          className="flex flex-col items-center justify-center rounded-[18px] border border-black/[0.05] bg-white/95 px-2 py-2.5 text-center shadow-[0_4px_14px_-8px_rgba(15,23,42,0.12)]"
        >
          <span
            className={cn("text-xl font-bold tabular-nums leading-none sm:text-2xl", item.accent)}
          >
            {item.value}
          </span>
          <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
