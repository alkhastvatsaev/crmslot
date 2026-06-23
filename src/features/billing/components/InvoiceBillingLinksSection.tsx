"use client";

import { CreditCard, FileText, ExternalLink, ClipboardList } from "lucide-react";
import QuoteListPanel from "@/features/quotes/components/QuoteListPanel";
import EInvoiceButton from "@/features/billing/components/EInvoiceButton";
import PortalLinkButton from "@/features/interventions/components/PortalLinkButton";
import InterventionPdfButton from "@/features/interventions/components/InterventionPdfButton";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  intervention: Intervention;
  quotesEnabled: boolean;
  viewInvoicePdfLabel: string;
  stripeLinkLabel: string;
  quotesPanelTitle: string;
};

export default function InvoiceBillingLinksSection({
  intervention,
  quotesEnabled,
  viewInvoicePdfLabel,
  stripeLinkLabel,
  quotesPanelTitle,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <EInvoiceButton intervention={intervention} />
        <PortalLinkButton intervention={intervention} />
      </div>

      {intervention.invoicePdfUrl ? (
        <a
          href={intervention.invoicePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-[12px] border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          {viewInvoicePdfLabel}
          <ExternalLink className="w-3 h-3 ml-auto" />
        </a>
      ) : null}

      <InterventionPdfButton intervention={intervention} />

      {quotesEnabled ? (
        <div className="border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {quotesPanelTitle}
            </span>
          </div>
          <QuoteListPanel interventionId={intervention.id} />
        </div>
      ) : null}

      {intervention.stripePaymentLinkUrl ? (
        <a
          href={intervention.stripePaymentLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-[12px] border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          {stripeLinkLabel}
          <ExternalLink className="w-3 h-3 ml-auto" />
        </a>
      ) : null}
    </>
  );
}
