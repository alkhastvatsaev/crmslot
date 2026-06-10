"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { computeCompanyKpi } from "@/features/dashboard/companyKpi";
import type { Intervention } from "@/features/interventions/types";

function KpiSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 80,
    H = 24;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - (v / max) * (H - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

function buildWeeklyCompletedCounts(interventions: Intervention[]): number[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const ymd = d.toISOString().slice(0, 10);
    return interventions.filter(
      (iv) =>
        (iv.status === "done" || iv.status === "invoiced") &&
        (iv.completedAt?.startsWith(ymd) ?? iv.scheduledDate === ymd)
    ).length;
  });
}

export default function CompanyKpiPanel() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.isTenantUser ? workspace.activeCompanyId : null;
  const { interventions } = useBackOfficeInterventions(companyId);
  const kpi = useMemo(() => computeCompanyKpi(interventions), [interventions]);
  const weeklyDone = useMemo(() => buildWeeklyCompletedCounts(interventions), [interventions]);

  if (!enabled || !companyId) return null;

  return (
    <section
      data-testid="company-kpi-panel"
      className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm sm:grid-cols-3"
    >
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">{t("kpi_panel.pending")}</p>
        <p className="text-lg font-bold text-amber-600">{kpi.pending}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">
          {t("kpi_panel.in_progress")}
        </p>
        <p className="text-lg font-bold text-blue-600">{kpi.inProgress}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">{t("kpi_panel.invoiced")}</p>
        <p className="text-lg font-bold text-emerald-600">{kpi.invoiced}</p>
      </div>
      <div className="col-span-2 sm:col-span-3">
        <p className="text-[10px] font-bold uppercase text-slate-400">{t("kpi_panel.revenue")}</p>
        <p className="font-bold text-slate-900">{(kpi.revenueCents / 100).toFixed(2)} €</p>
        {kpi.avgCloseDays != null ? (
          <p className="text-xs text-slate-500">
            {t("kpi_panel.avg_close")}: {kpi.avgCloseDays} j
          </p>
        ) : null}
      </div>
      <div className="col-span-2 sm:col-span-3 flex items-center justify-between pt-1 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase text-slate-400">7 derniers jours</p>
        <KpiSparkline values={weeklyDone} color="#10b981" />
      </div>
    </section>
  );
}
