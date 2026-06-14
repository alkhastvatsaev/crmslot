"use client";

import { CalendarClock, FileText, CreditCard } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import {
  formatPortalAppointmentLabel,
  mapI18nLanguageToLocale,
} from "@/features/interventions/technicianSchedule";

type PortalSection = "eta" | "payment" | "invoice";

type Props = {
  status?: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
  invoicePdfUrl?: string | null;
  paymentStatus?: string | null;
  stripePaymentLinkUrl?: string | null;
  sections?: PortalSection[];
  compact?: boolean;
  premium?: boolean;
  unified?: boolean;
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
  sections = ["eta", "payment", "invoice"],
  compact = false,
  premium = false,
  unified = false,
}: Props) {
  const { t, language } = useTranslation();
  const enabled = useFeatureFlag("pwaV2Bundle");
  if (!enabled) return null;

  const locale = mapI18nLanguageToLocale(language);
  const date = scheduledDate?.trim() || requestedDate?.trim() || "";
  const time = scheduledTime?.trim() || requestedTime?.trim() || "";
  const eta = date
    ? formatPortalAppointmentLabel(date, time || null, locale)
    : status === "pending" || status === "pending_needs_address"
      ? String(t("portal_enrichment.eta_asap"))
      : null;

  const payLabel =
    paymentStatus === "paid"
      ? t("portal_enrichment.payment_paid")
      : paymentStatus === "pending"
        ? t("portal_enrichment.payment_pending")
        : null;

  const showEta = sections.includes("eta") && eta;
  const showPayment = sections.includes("payment") && payLabel;
  const showInvoice = sections.includes("invoice") && invoicePdfUrl;
  const showPayLink =
    sections.includes("payment") && stripePaymentLinkUrl && paymentStatus !== "paid";

  if (!showEta && !showPayment && !showInvoice && !showPayLink) return null;

  return (
    <section
      data-testid="requester-portal-enrichment"
      className={
        compact
          ? "space-y-2"
          : "mx-4 mb-3 space-y-2 rounded-2xl border border-black/5 bg-white/80 px-4 py-3 shadow-sm"
      }
    >
      {showEta ? (
        <div
          className={
            premium
              ? unified
                ? "flex flex-col items-center justify-center px-1 py-1 text-center"
                : "flex flex-col items-center justify-center rounded-2xl bg-slate-50/90 px-4 py-3 text-center ring-1 ring-black/[0.04]"
              : compact
                ? "flex flex-col items-center justify-center rounded-xl bg-blue-50/90 px-3 py-2 text-center ring-1 ring-blue-100"
                : "flex flex-col items-center justify-center rounded-2xl bg-blue-50/90 px-3.5 py-3 text-center ring-1 ring-blue-100"
          }
          data-testid="portal-enrichment-eta-block"
        >
          <CalendarClock
            className={
              premium
                ? "mb-1.5 h-4 w-4 text-slate-500"
                : compact
                  ? "mb-1 h-4 w-4 text-blue-600"
                  : "mb-1.5 h-5 w-5 text-blue-600"
            }
            aria-hidden
          />
          <div
            className={
              premium
                ? "text-[10px] font-medium tracking-wide text-slate-400"
                : "text-[10px] font-bold uppercase tracking-[0.08em] text-blue-700"
            }
          >
            {t("portal_enrichment.eta_label")}
          </div>
          <div
            data-testid="portal-enrichment-eta"
            className={
              premium
                ? "mt-1 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-slate-900"
                : compact
                  ? "mt-0.5 text-[13px] font-bold leading-snug text-slate-900"
                  : "mt-1 text-[15px] font-bold leading-snug text-slate-900"
            }
          >
            {eta}
          </div>
        </div>
      ) : null}
      {showPayment ? (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-700">
          <CreditCard className="h-4 w-4 text-emerald-600" aria-hidden />
          <span data-testid="portal-enrichment-payment">{payLabel}</span>
        </p>
      ) : null}
      {showInvoice ? (
        <a
          href={invoicePdfUrl!}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="portal-enrichment-invoice"
          className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <FileText className="h-4 w-4" aria-hidden />
          {t("portal_enrichment.invoice_pdf")}
        </a>
      ) : null}
      {showPayLink ? (
        <a
          href={stripePaymentLinkUrl!}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="portal-enrichment-pay-link"
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
        >
          {t("portal_enrichment.pay_now")}
        </a>
      ) : null}
    </section>
  );
}
