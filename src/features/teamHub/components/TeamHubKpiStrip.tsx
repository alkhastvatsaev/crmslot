"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { TeamHubKpis } from "@/features/teamHub/teamHubPatronMetrics";

type Props = {
  kpis: TeamHubKpis;
  className?: string;
};

export default function TeamHubKpiStrip({ kpis, className }: Props) {
  const { t } = useTranslation();

  const items = [
    {
      testId: "team-hub-kpi-total",
      value: String(kpis.totalCount),
      label: t("teamHub.kpi.total"),
      accent: "text-slate-900",
    },
    {
      testId: "team-hub-kpi-active",
      value: String(kpis.activeCount),
      label: t("teamHub.kpi.active"),
      accent: "text-emerald-700",
    },
    {
      testId: "team-hub-kpi-techs",
      value: String(kpis.technicianCount),
      label: t("teamHub.kpi.technicians"),
      accent: "text-sky-700",
    },
  ];

  return (
    <div
      data-testid="team-hub-kpi-strip"
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
