"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { computeCompanyKpi } from "@/features/dashboard/companyKpi";

export default function CompanyKpiPanel() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.isTenantUser ? workspace.activeCompanyId : null;
  const { interventions } = useBackOfficeInterventions(companyId);
  const kpi = useMemo(() => computeCompanyKpi(interventions), [interventions]);

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
        <p className="text-[10px] font-bold uppercase text-slate-400">{t("kpi_panel.in_progress")}</p>
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
    </section>
  );
}
