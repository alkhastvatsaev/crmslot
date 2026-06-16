"use client";

import BiReportsPanel from "@/features/analytics/components/BiReportsPanel";
import CarouselUsagePanel from "@/features/analytics/components/CarouselUsagePanel";
import { useCompanyBillingInterventions } from "@/features/billingHub/hooks/useCompanyBillingInterventions";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function ReportsPage() {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("analyticsReports");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = (workspace?.activeCompanyId ?? "").trim();
  const { interventions, loading } = useCompanyBillingInterventions(companyId || null);

  if (!enabled) {
    return (
      <main className="mx-auto max-w-lg p-8 text-center text-sm text-slate-600">
        {t("analytics.disabled")}
      </main>
    );
  }

  return (
    <main data-testid="reports-page" className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-black text-slate-900">{t("analytics.reports_title")}</h1>
      <CarouselUsagePanel />
      {loading ? (
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      ) : (
        <BiReportsPanel interventions={interventions} />
      )}
    </main>
  );
}
