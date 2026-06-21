"use client";

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Receipt,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { formatPatronEuros } from "@/features/commissionsHub/commissionsHubFormat";
import type {
  CaseHubAlert,
  CaseHubDetailSnapshot,
} from "@/features/caseHub/caseHubInterventionDetail";
import type { Intervention } from "@/features/interventions/types";

const ALERT_TONE: Record<CaseHubAlert["tone"], string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  sky: "border-sky-200 bg-sky-50 text-sky-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

const PAYMENT_TONE: Record<string, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  unpaid: "bg-slate-100 text-slate-700 border-slate-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
};

type Props = {
  intervention: Intervention;
  snapshot: CaseHubDetailSnapshot;
  techName: string | null;
  statusLabel: string;
  statusBadgeClass: string;
};

export default function CaseHubDetailSummary({
  intervention,
  snapshot,
  techName,
  statusLabel,
  statusBadgeClass,
}: Props) {
  const { t } = useTranslation();
  const paymentKey = snapshot.paymentStatus ?? "unpaid";
  const paymentLabel = t(`caseHub.payment.${paymentKey}` as "caseHub.payment.unpaid");
  const mapsQuery = snapshot.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(snapshot.address)}`
    : null;

  return (
    <div
      data-testid="case-hub-detail-summary"
      className="flex shrink-0 flex-col gap-3 border-b border-black/[0.05] bg-gradient-to-b from-sky-50/70 to-white px-4 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            data-testid="case-hub-selected-title"
            className="line-clamp-2 text-[17px] font-black leading-tight text-slate-900"
          >
            {snapshot.clientName}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("caseHub.right.case_id").replace("{{id}}", snapshot.shortId)}
          </p>
        </div>
        <span
          data-testid={`case-hub-status-${intervention.status ?? "pending"}`}
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            statusBadgeClass
          )}
        >
          {statusLabel}
        </span>
      </div>

      {snapshot.problemPreview ? (
        <p
          data-testid="case-hub-problem-preview"
          className="line-clamp-2 text-[12px] leading-snug text-slate-600"
        >
          {snapshot.problemPreview}
        </p>
      ) : null}

      {snapshot.alerts.length > 0 ? (
        <ul
          data-testid="case-hub-alerts"
          className="flex flex-col gap-1.5"
          aria-label={t("caseHub.right.alerts_aria")}
        >
          {snapshot.alerts.map((alert) => (
            <li
              key={alert.id}
              data-testid={`case-hub-alert-${alert.id}`}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-2.5 py-2 text-[11px] font-semibold leading-snug",
                ALERT_TONE[alert.tone]
              )}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {t(alert.labelKey)}
                {alert.detail ? (
                  <span className="mt-0.5 block font-medium opacity-90">{alert.detail}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <div
          data-testid="case-hub-kpi-billing"
          className="rounded-xl border border-black/[0.06] bg-white/90 px-2.5 py-2"
        >
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
            <Receipt className="h-3 w-3" aria-hidden />
            {t("caseHub.right.kpi_billing")}
          </span>
          <p className="mt-0.5 text-[14px] font-black tabular-nums text-slate-900">
            {snapshot.billingCents > 0 ? formatPatronEuros(snapshot.billingCents) : "—"}
          </p>
        </div>
        <div
          data-testid="case-hub-kpi-commission"
          className="rounded-xl border border-black/[0.06] bg-white/90 px-2.5 py-2"
        >
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
            <Banknote className="h-3 w-3" aria-hidden />
            {t("caseHub.right.kpi_commission")}
          </span>
          <p className="mt-0.5 text-[14px] font-black tabular-nums text-violet-900">
            {snapshot.commissionCents > 0 ? formatPatronEuros(snapshot.commissionCents) : "—"}
          </p>
        </div>
        <div
          data-testid="case-hub-kpi-payment"
          className="rounded-xl border border-black/[0.06] bg-white/90 px-2.5 py-2"
        >
          <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
            {t("caseHub.right.kpi_payment")}
          </span>
          <p className="mt-1">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                PAYMENT_TONE[paymentKey] ?? PAYMENT_TONE.unpaid
              )}
            >
              {paymentLabel}
            </span>
          </p>
        </div>
        <div
          data-testid="case-hub-kpi-schedule"
          className="rounded-xl border border-black/[0.06] bg-white/90 px-2.5 py-2"
        >
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {t("caseHub.right.kpi_schedule")}
          </span>
          <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-800">
            {snapshot.scheduleLabel ?? t("caseHub.no_date")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {snapshot.phone ? (
          <a
            href={`tel:${snapshot.phone}`}
            data-testid="case-hub-call-client"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-900 transition hover:bg-sky-100"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {snapshot.phone}
          </a>
        ) : null}
        {snapshot.email ? (
          <a
            href={`mailto:${snapshot.email}`}
            data-testid="case-hub-email-client"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            <span className="max-w-[140px] truncate">{snapshot.email}</span>
          </a>
        ) : null}
        {mapsQuery ? (
          <a
            href={mapsQuery}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="case-hub-open-map"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {t("caseHub.right.open_map")}
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
          </a>
        ) : null}
        {techName ? (
          <span
            data-testid="case-hub-tech-name"
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-900"
          >
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            {techName}
          </span>
        ) : null}
        {snapshot.paymentLinkUrl ? (
          <a
            href={snapshot.paymentLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="case-hub-payment-link"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-100"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t("caseHub.right.payment_link")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
