"use client";

import { FileText, Loader2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";

function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatWhen(raw: string | null): string {
  if (!raw) return "—";
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Panneau droit — liste factures + aperçu PDF. */
export default function ChatbotInvoicesPanel() {
  const {
    chatbotInvoices,
    chatbotInvoicesLoading,
    documentPreview,
    openDocumentPreview,
  } = useChatbotContext();

  const selectedId = documentPreview.kind === "invoice" ? documentPreview.interventionId : "";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/90"
      data-testid="chatbot-invoices-panel"
    >
      <header className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-emerald-600" />
          <h2 className="text-[13px] font-bold text-slate-900">Factures</h2>
        </div>
      </header>

      <div className="max-h-[42%] shrink-0 overflow-y-auto border-b border-slate-200 p-2">
        {chatbotInvoicesLoading ? (
          <div className="flex justify-center py-6" data-testid="chatbot-invoices-loading">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          </div>
        ) : chatbotInvoices.length === 0 ? (
          <p className="px-2 py-4 text-center text-[12px] text-slate-500" data-testid="chatbot-invoices-empty">
            Aucune facture pour cette société. Facturez un dossier terminé via le chatbot ou le back-office.
          </p>
        ) : (
          <ul className="space-y-1.5" data-testid="chatbot-invoices-list">
            {chatbotInvoices.map((row) => {
              const active = row.interventionId === selectedId;
              return (
                <li key={row.interventionId}>
                  <button
                    type="button"
                    data-testid={`chatbot-invoice-row-${row.interventionId}`}
                    onClick={() => openDocumentPreview(row.interventionId, "invoice")}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-emerald-300 bg-emerald-50/90 ring-1 ring-emerald-200"
                        : "border-slate-100 bg-white hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-900">{row.clientLabel}</p>
                        <p className="truncate text-[10px] text-slate-500">
                          {formatWhen(row.invoicedAt)} · {row.status}
                        </p>
                        {row.problem ? (
                          <p className="mt-0.5 truncate text-[11px] text-slate-600">{row.problem}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[12px] font-bold text-emerald-800">
                        {formatEur(row.totalCents)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {documentPreview.kind === "invoice" &&
        (documentPreview.loading || documentPreview.blobUrl || documentPreview.error) ? (
          <>
            <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-100 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600">
              <FileText className="h-3.5 w-3.5" />
              Aperçu facture
            </div>
            {documentPreview.loading ? (
              <div className="flex flex-1 items-center justify-center" data-testid="chatbot-invoice-pdf-loading">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : documentPreview.error ? (
              <p
                className="flex flex-1 items-center justify-center px-4 text-center text-[12px] text-red-800"
                data-testid="chatbot-invoice-pdf-error"
              >
                {documentPreview.error}
              </p>
            ) : documentPreview.blobUrl ? (
              <iframe
                data-testid="chatbot-invoice-pdf-iframe"
                title="Facture"
                src={documentPreview.blobUrl}
                className="min-h-0 flex-1 w-full border-0 bg-white"
              />
            ) : null}
          </>
        ) : (
          <p
            className="flex flex-1 items-center justify-center px-4 text-center text-[12px] text-slate-500"
            data-testid="chatbot-invoices-pdf-hint"
          >
            Sélectionnez une facture pour l&apos;afficher ici.
          </p>
        )}
      </div>
    </div>
  );
}
