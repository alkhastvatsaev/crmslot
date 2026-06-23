"use client";

import { useMemo } from "react";
import { ArrowLeft, Download, Loader2, Receipt } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useChatbotContextOptional } from "@/features/chatbot/ChatbotContext";
import ChatbotPdfPreviewPanel from "@/features/chatbot/components/ChatbotPdfPreviewPanel";
import { isPortalInvoiceAvailable } from "@/features/company/portalInvoiceAvailability";
import { useRequesterPortalInterventions } from "@/features/company/hooks/useRequesterPortalInterventions";
import { useRequesterHub } from "@/context/RequesterHubContext";
import RequesterPaymentPanel from "@/features/interventions/components/RequesterPaymentPanel";
import { cn } from "@/lib/utils";

type Props = {
  interventionId: string | null;
};

function PortalInvoicePendingIllustration() {
  return (
    <svg
      data-testid="company-hub-invoice-pending"
      viewBox="0 0 120 150"
      width="120"
      height="150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="text-slate-300"
    >
      <rect x="8" y="4" width="96" height="132" rx="8" fill="currentColor" fillOpacity="0.12" />
      <rect x="8" y="4" width="96" height="132" rx="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M80 4v20a4 4 0 0 0 4 4h20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="22" y="36" width="52" height="5" rx="2.5" fill="currentColor" fillOpacity="0.35" />
      <rect x="22" y="50" width="68" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" />
      <rect x="22" y="60" width="60" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" />
      <rect x="22" y="70" width="64" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" />
      <rect x="22" y="88" width="68" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="22" y="98" width="48" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="58" y="114" width="32" height="14" rx="4" fill="#f59e0b" fillOpacity="0.18" />
      <text
        x="74"
        y="124"
        textAnchor="middle"
        fill="#d97706"
        fontSize="8"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        PDF
      </text>
    </svg>
  );
}

function formatEuros(cents: number | null | undefined): string | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function CompanyHubInvoiceTab({ interventionId }: Props) {
  const { t } = useTranslation();
  const chatbotCtx = useChatbotContextOptional();
  const { profile } = useRequesterHub();
  const { interventions, loading } = useRequesterPortalInterventions(profile);

  const activeIntervention = useMemo(() => {
    if (interventionId) {
      const hit = interventions.find((row) => row.id === interventionId);
      if (hit) return hit;
    }
    return interventions[0] ?? null;
  }, [interventionId, interventions]);

  const invoiceReady = isPortalInvoiceAvailable(activeIntervention);
  const amountLabel = formatEuros(activeIntervention?.invoiceAmountCents);

  if (chatbotCtx?.documentPreview.blobUrl || chatbotCtx?.documentPreview.loading) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col bg-slate-50"
        data-testid="company-hub-invoice-tab"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => chatbotCtx.closeDocumentPreview()}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("company_hub.invoice.back_to_tab")}
          </button>
          <span className="text-xs font-medium text-slate-400">
            {chatbotCtx.documentPreview.title}
          </span>
        </div>
        <div className="relative min-h-0 flex-1">
          <ChatbotPdfPreviewPanel />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        data-testid="company-hub-invoice-tab"
        className="flex flex-1 items-center justify-center text-slate-400"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!activeIntervention) {
    return (
      <div
        data-testid="company-hub-invoice-tab"
        className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Receipt className="h-7 w-7" strokeWidth={1.5} aria-hidden />
        </span>
        <p className="max-w-[280px] text-[14px] font-semibold text-slate-800">
          {t("company_hub.invoice.empty_no_case_title")}
        </p>
        <p className="max-w-[300px] text-[13px] leading-relaxed text-slate-500">
          {t("company_hub.invoice.empty_no_case_hint")}
        </p>
      </div>
    );
  }

  if (!invoiceReady) {
    return (
      <div
        data-testid="company-hub-invoice-tab"
        className="flex flex-1 flex-col items-center justify-center px-6 py-10"
      >
        <PortalInvoicePendingIllustration />
      </div>
    );
  }

  const pdfUrl = activeIntervention.invoicePdfUrl?.trim() || null;

  return (
    <div
      data-testid="company-hub-invoice-tab"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 p-4 sm:p-6"
    >
      <h3 className="mb-2 text-[15px] font-semibold text-slate-900">
        {t("company_hub.invoice.ready_title")}
      </h3>
      <p className="mb-5 text-[13px] text-slate-500">{t("company_hub.invoice.ready_hint")}</p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-testid="company-hub-invoice-view-btn"
          onClick={() =>
            chatbotCtx?.openDocumentPreview(activeIntervention.id, "invoice", false, "right")
          }
          className={cn(
            "group flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 text-left shadow-sm transition-all",
            "hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <Receipt className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
              {t("company_hub.invoice.view_pdf")}
            </div>
            {amountLabel ? (
              <div
                data-testid="company-hub-invoice-amount"
                className="mt-0.5 text-[12px] font-medium text-slate-600"
              >
                {amountLabel}
              </div>
            ) : (
              <div className="mt-0.5 text-[12px] text-slate-500">
                {t("company_hub.invoice.view_pdf_hint")}
              </div>
            )}
          </div>
        </button>

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="company-hub-invoice-download-link"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("company_hub.invoice.download_storage")}
          </a>
        ) : null}

        <RequesterPaymentPanel
          interventionId={activeIntervention.id}
          paymentStatus={activeIntervention.paymentStatus}
          invoiceAmountCents={activeIntervention.invoiceAmountCents}
          stripePaymentLinkUrl={activeIntervention.stripePaymentLinkUrl}
        />
      </div>
    </div>
  );
}
