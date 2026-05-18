"use client";

import { CalendarClock, FileText, CreditCard } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";

type Props = {
  status?: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
  invoicePdfUrl?: string | null;
  paymentStatus?: string | null;
  stripePaymentLinkUrl?: string | null;
};

export default function RequesterPortalEnrichment({
  status,
  scheduledDate,
  scheduledTime,
  requestedDate,
  requestedTime,
  invoicePdfUrl,
  paymentStatus,
  stripePaymentLinkUrl,
}: Props) {
  const { t } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  if (!enabled) return null;

  const date = scheduledDate?.trim() || requestedDate?.trim() || "";
  const time = scheduledTime?.trim() || requestedTime?.trim() || "";
  const eta =
    date && time
      ? `${date} · ${time}`
      : date
        ? date
        : status === "pending" || status === "pending_needs_address"
          ? String(t("portal_enrichment.eta_asap"))
          : null;

  const payLabel =
    paymentStatus === "paid"
      ? t("portal_enrichment.payment_paid")
      : paymentStatus === "pending"
        ? t("portal_enrichment.payment_pending")
        : null;

  if (!eta && !invoicePdfUrl && !payLabel && !stripePaymentLinkUrl) return null;

  return (
    <section
      data-testid="requester-portal-enrichment"
      className="mx-4 mb-3 space-y-2 rounded-2xl border border-black/5 bg-white/80 px-4 py-3 shadow-sm"
    >
      {eta ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarClock className="h-4 w-4 text-blue-600" aria-hidden />
          <span>{t("portal_enrichment.eta_label")}</span>
          <span data-testid="portal-enrichment-eta" className="text-slate-600">
            {eta}
          </span>
        </p>
      ) : null}
      {payLabel ? (
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <CreditCard className="h-4 w-4 text-emerald-600" aria-hidden />
          <span data-testid="portal-enrichment-payment">{payLabel}</span>
        </p>
      ) : null}
      {invoicePdfUrl ? (
        <a
          href={invoicePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="portal-enrichment-invoice"
          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <FileText className="h-4 w-4" aria-hidden />
          {t("portal_enrichment.invoice_pdf")}
        </a>
      ) : null}
      {stripePaymentLinkUrl && paymentStatus !== "paid" ? (
        <a
          href={stripePaymentLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="portal-enrichment-pay-link"
          className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
        >
          {t("portal_enrichment.pay_now")}
        </a>
      ) : null}
    </section>
  );
}
