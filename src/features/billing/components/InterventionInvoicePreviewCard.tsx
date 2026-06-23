"use client";

import { ExternalLink, FileText, Sparkles } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { DraftBillingLine } from "@/features/interventions";
import {
  formatInvoiceTotalEur,
  invoiceTotalCents,
} from "@/features/interventions/technicianInvoiceQuickAdjust";

type Props = {
  clientName?: string | null;
  clientEmail?: string | null;
  invoiceNumber?: string | null;
  invoiceDateLabel?: string | null;
  billingLines?: DraftBillingLine[];
  invoiceAmountCents?: number | null;
  aiNote?: string | null;
  invoicePdfUrl?: string | null;
};

export default function InterventionInvoicePreviewCard({
  clientName,
  clientEmail,
  invoiceNumber,
  invoiceDateLabel,
  billingLines,
  invoiceAmountCents,
  aiNote,
  invoicePdfUrl,
}: Props) {
  const { t } = useTranslation();
  const lines = billingLines ?? [];
  const totalCents =
    typeof invoiceAmountCents === "number" && invoiceAmountCents > 0
      ? invoiceAmountCents
      : invoiceTotalCents(lines);
  const hasLines = lines.length > 0;
  const pdfUrl = invoicePdfUrl?.trim() ?? "";

  if (!hasLines && !pdfUrl) {
    return (
      <div
        data-testid="backoffice-invoice-preview-empty"
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[13px] font-semibold text-slate-500"
      >
        {String(t("backoffice.inbox.invoice_preview_empty"))}
      </div>
    );
  }

  const displayDate =
    invoiceDateLabel?.trim() ||
    new Date().toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div data-testid="backoffice-invoice-preview" className="space-y-3">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {String(t("backoffice.inbox.invoice_preview_label"))}
      </p>

      {hasLines ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-slate-100 pb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              MAP BELGIQUE
            </p>
            <p className="mt-1 text-[17px] font-black text-slate-900">
              {String(t("technician_hub.finish.invoice.preview_heading"))}
            </p>
            <p className="text-[11px] text-slate-500">{displayDate}</p>
            {invoiceNumber ? (
              <p className="mt-1 text-[11px] font-semibold text-slate-600">{invoiceNumber}</p>
            ) : null}
          </div>

          {clientName ? (
            <p className="mb-3 text-[12px] font-semibold text-slate-700">
              {String(t("technician_hub.finish.invoice.preview_to"))} {clientName}
            </p>
          ) : null}

          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <th className="pb-1.5">
                  {String(t("technician_hub.finish.invoice.preview_col_desc"))}
                </th>
                <th className="pb-1.5 text-right">
                  {String(t("technician_hub.finish.invoice.preview_col_qty"))}
                </th>
                <th className="pb-1.5 text-right">
                  {String(t("technician_hub.finish.invoice.preview_col_price"))}
                </th>
                <th className="pb-1.5 text-right">
                  {String(t("technician_hub.finish.invoice.preview_col_total"))}
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={`${line.description}-${i}`} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2 font-medium text-slate-700">{line.description}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-500">{line.quantity}</td>
                  <td className="py-1.5 text-right tabular-nums text-slate-500">
                    {(line.unitPriceCents / 100).toFixed(2)} €
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-semibold text-slate-800">
                    {((line.unitPriceCents * (line.quantity || 1)) / 100).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
            <span className="text-[13px] font-bold text-slate-900">
              {String(t("technician_hub.finish.invoice.preview_total_label"))}
            </span>
            <span
              data-testid="backoffice-invoice-preview-total"
              className="text-[15px] font-black tabular-nums text-slate-900"
            >
              {formatInvoiceTotalEur(totalCents)}
            </span>
          </div>

          {clientEmail ? <p className="mt-3 text-[11px] text-slate-500">{clientEmail}</p> : null}

          {aiNote ? (
            <p
              data-testid="backoffice-invoice-preview-ai-note"
              className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-600"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
              {aiNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {pdfUrl ? (
        <div className="space-y-2" data-testid="backoffice-invoice-pdf-embed-section">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="backoffice-invoice-pdf-link"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <FileText className="h-4 w-4" aria-hidden />
            {String(t("backoffice.inbox.view_invoice_pdf"))}
            {invoiceNumber ? ` — ${invoiceNumber}` : ""}
            <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-70" aria-hidden />
          </a>
          <iframe
            data-testid="backoffice-invoice-pdf-embed"
            src={pdfUrl}
            title={String(t("backoffice.inbox.invoice_pdf_label"))}
            className="h-80 w-full rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>
      ) : null}
    </div>
  );
}
