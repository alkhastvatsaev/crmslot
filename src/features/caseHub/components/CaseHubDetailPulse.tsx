"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { formatPatronEuros } from "@/features/commissionsHub/commissionsHubFormat";
import CaseHubDetailStep from "@/features/caseHub/components/CaseHubDetailStep";
import {
  CASE_HUB_ALERT_ACCENT,
  CASE_HUB_DETAIL,
  CASE_HUB_INSIGHT_DOT,
  CASE_HUB_PAYMENT_TONE,
} from "@/features/caseHub/caseHubDetailTheme";
import type {
  CaseHubAlert,
  CaseHubDetailSnapshot,
  CaseHubInsight,
} from "@/features/caseHub/caseHubInterventionDetail";

type Props = {
  snapshot: CaseHubDetailSnapshot;
  techName: string | null;
};

function AlertList({ alerts }: { alerts: CaseHubAlert[] }) {
  const { t } = useTranslation();
  if (alerts.length === 0) return null;

  return (
    <ul
      data-testid="case-hub-alerts"
      className="space-y-2"
      aria-label={t("caseHub.right.alerts_aria")}
    >
      {alerts.map((alert) => (
        <li
          key={alert.id}
          data-testid={`case-hub-alert-${alert.id}`}
          className={cn(
            "rounded-[14px] px-3 py-2 text-[12px] font-semibold leading-snug ring-1 ring-inset ring-slate-100",
            CASE_HUB_ALERT_ACCENT[alert.tone]
          )}
        >
          {t(alert.labelKey)}
          {alert.detail ? (
            <span className="mt-0.5 block font-medium text-slate-500">{alert.detail}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function InsightList({ insights }: { insights: CaseHubInsight[] }) {
  const { t } = useTranslation();
  if (insights.length === 0) return null;

  return (
    <ul data-testid="case-hub-detail-insights" className="space-y-1.5">
      {insights.slice(0, 4).map((insight) => (
        <li
          key={insight.id}
          data-testid={`case-hub-insight-${insight.id}`}
          className="flex items-baseline gap-2 text-[12px] text-slate-600"
        >
          <span
            aria-hidden
            className={cn(
              "mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
              CASE_HUB_INSIGHT_DOT[insight.tone]
            )}
          />
          <span>
            <span className="font-semibold tabular-nums text-slate-900">{insight.value}</span>
            <span className="text-slate-500"> · {t(insight.labelKey)}</span>
            {insight.detail || insight.detailKey ? (
              <span className="text-slate-400">
                {" "}
                · {insight.detailKey ? t(insight.detailKey) : insight.detail}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Étape 2 — Chiffres, alertes, signaux. */
export default function CaseHubDetailPulse({ snapshot, techName }: Props) {
  const { t } = useTranslation();
  const paymentKey = snapshot.paymentStatus ?? "unpaid";
  const paymentLabel = t(`caseHub.payment.${paymentKey}` as "caseHub.payment.unpaid");
  const hasSignals = snapshot.alerts.length > 0 || snapshot.insights.length > 0;

  return (
    <CaseHubDetailStep
      step={2}
      title={t("caseHub.pipeline.step_state")}
      testId="case-hub-detail-pulse"
    >
      <div className="space-y-4">
        <dl className={CASE_HUB_DETAIL.kpiList}>
          <div data-testid="case-hub-kpi-billing" className={CASE_HUB_DETAIL.kpiRow}>
            <dt className={CASE_HUB_DETAIL.kpiLabel}>{t("caseHub.right.kpi_billing")}</dt>
            <dd className={CASE_HUB_DETAIL.kpiValue}>
              {snapshot.billingCents > 0 ? formatPatronEuros(snapshot.billingCents) : "—"}
            </dd>
          </div>
          <div data-testid="case-hub-kpi-payment" className={CASE_HUB_DETAIL.kpiRow}>
            <dt className={CASE_HUB_DETAIL.kpiLabel}>{t("caseHub.right.kpi_payment")}</dt>
            <dd
              className={cn(
                CASE_HUB_DETAIL.kpiValueSm,
                CASE_HUB_PAYMENT_TONE[paymentKey] ?? "text-slate-800"
              )}
            >
              {paymentLabel}
            </dd>
          </div>
          <div data-testid="case-hub-kpi-schedule" className={CASE_HUB_DETAIL.kpiRow}>
            <dt className={CASE_HUB_DETAIL.kpiLabel}>{t("caseHub.right.kpi_schedule")}</dt>
            <dd className={CASE_HUB_DETAIL.kpiValueSm}>
              {snapshot.scheduleLabel ?? t("caseHub.no_date")}
            </dd>
          </div>
          {techName ? (
            <div data-testid="case-hub-tech-name" className={CASE_HUB_DETAIL.kpiRow}>
              <dt className={CASE_HUB_DETAIL.kpiLabel}>{t("caseHub.right.kpi_technician")}</dt>
              <dd className={CASE_HUB_DETAIL.kpiValueSm}>{techName}</dd>
            </div>
          ) : null}
        </dl>

        {hasSignals ? (
          <div className="space-y-3 border-t border-slate-100/90 pt-3">
            <AlertList alerts={snapshot.alerts} />
            <InsightList insights={snapshot.insights} />
          </div>
        ) : null}
      </div>
    </CaseHubDetailStep>
  );
}
