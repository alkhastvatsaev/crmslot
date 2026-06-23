"use client";

import InvoiceBillingPanelHeader from "@/features/billing/components/InvoiceBillingPanelHeader";
import InvoiceBillingLinesTable from "@/features/billing/components/InvoiceBillingLinesTable";
import InvoiceBillingTemplateSelect from "@/features/billing/components/InvoiceBillingTemplateSelect";
import InvoiceBillingPaymentSection from "@/features/billing/components/InvoiceBillingPaymentSection";
import InvoiceBillingLinksSection from "@/features/billing/components/InvoiceBillingLinksSection";
import { useInvoiceBillingPanelController } from "@/features/billing/hooks/useInvoiceBillingPanelController";
import type { InvoiceBillingPanelProps } from "@/features/billing/invoiceBillingPanelTypes";

export default function InvoiceBillingPanel(props: InvoiceBillingPanelProps) {
  const c = useInvoiceBillingPanelController(props);

  return (
    <div className="space-y-2">
      <InvoiceBillingPanelHeader
        expanded={c.expanded}
        panelTitle={String(c.t("billing.panel_title"))}
        paymentStatus={c.paymentStatus}
        statusLabel={c.statusLabels[c.paymentStatus] ?? c.paymentStatus}
        onToggle={() => c.setExpanded((v) => !v)}
      />

      {c.expanded && (
        <div className="rounded-[18px] border border-slate-100 bg-white p-4 space-y-4">
          {c.intervention.billingLines && c.intervention.billingLines.length > 0 ? (
            <InvoiceBillingLinesTable billingLines={c.intervention.billingLines} />
          ) : null}

          <InvoiceBillingTemplateSelect
            label={String(c.t("billing.template_label"))}
            placeholder={String(c.t("billing.template_placeholder"))}
            onSelect={c.handleTemplateSelect}
          />

          <InvoiceBillingPaymentSection
            intervention={c.intervention}
            paymentStatus={c.paymentStatus}
            statusLabels={c.statusLabels}
            saving={c.saving}
            invoicedAtLabel={String(c.t("billing.invoiced_at"))}
            paidAtLabel={String(c.t("billing.paid_at"))}
            paymentStatusLabel={String(c.t("billing.payment_status"))}
            onStatusChange={c.handleStatusChange}
          />

          <InvoiceBillingLinksSection
            intervention={c.intervention}
            quotesEnabled={c.quotesEnabled}
            viewInvoicePdfLabel={String(c.t("billing.view_invoice_pdf"))}
            stripeLinkLabel={String(c.t("billing.stripe_link"))}
            quotesPanelTitle={String(c.t("quotes.panel_title"))}
          />
        </div>
      )}
    </div>
  );
}
