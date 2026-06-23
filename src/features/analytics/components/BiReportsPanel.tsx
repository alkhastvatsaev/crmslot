"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import { computeBillingHubMetrics } from "@/features/billingHub/billingHubMetrics";
import { trackProductEvent } from "@/core/analytics/productAnalytics";
import type { Intervention } from "@/features/interventions";

type Props = { interventions: Intervention[] };

export default function BiReportsPanel({ interventions }: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("analyticsReports");
  const metrics = useMemo(() => computeBillingHubMetrics(interventions), [interventions]);

  if (!enabled) return null;

  return (
    <section
      data-testid="bi-reports-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      onMouseEnter={() => trackProductEvent("bi_reports_viewed")}
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("analytics.reports_title")}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">{t("analytics.paid_count")}</dt>
          <dd className="text-lg font-black text-slate-900">{metrics.paid}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <dt className="text-slate-500">{t("analytics.unpaid_count")}</dt>
          <dd className="text-lg font-black text-amber-700">{metrics.unpaid}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 col-span-2">
          <dt className="text-slate-500">{t("analytics.revenue_cents")}</dt>
          <dd className="text-lg font-black text-emerald-700">
            {(metrics.totalHtCents / 100).toFixed(2)} €
          </dd>
        </div>
      </dl>
    </section>
  );
}
