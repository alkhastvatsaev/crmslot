"use client";

import { useMemo } from "react";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPreviewOverlayForTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import ChatbotPdfPreviewOverlay from "@/features/chatbot/components/ChatbotPdfPreviewOverlay";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import type { SupplierOrder } from "@/features/suppliers/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} €`;
}

function formatWhen(raw: string | null | undefined): string {
  if (!raw) return "";
  let ms = 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    ms = (raw as { seconds: number }).seconds * 1000;
  } else {
    const t = Date.parse(String(raw));
    if (!Number.isFinite(t)) return "";
    ms = t;
  }
  return new Date(ms).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

function supplierOrderTitle(order: SupplierOrder): string {
  const lines = order.lines ?? [];
  const first = lines[0]?.label?.trim();
  if (!first) return "Commande";
  if (lines.length === 1) return first;
  return first;
}

function resolveSelectedKey(
  preview: {
    kind: string;
    interventionId: string;
    supplierOrderId?: string | null;
    loading: boolean;
    blobUrl: string | null;
    error: string | null;
  },
): string | null {
  if (!preview.loading && !preview.blobUrl && !preview.error) return null;
  if (preview.kind === "invoice" && preview.interventionId) {
    return `invoice:${preview.interventionId}`;
  }
  if (preview.supplierOrderId) {
    return `supplier:${preview.supplierOrderId}`;
  }
  if (preview.kind === "material_order" && preview.interventionId) {
    return `material:${preview.interventionId}`;
  }
  return null;
}

type DocTileKind = "invoice" | "order";

type DocumentTileProps = {
  testId: string;
  active: boolean;
  disabled?: boolean;
  kind: DocTileKind;
  title: string;
  meta?: string;
  onClick: () => void;
};

function DocumentTile({ testId, active, disabled, kind, title, meta, onClick }: DocumentTileProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      style={outfit}
      className={cn(
        "group relative flex aspect-square w-full flex-col justify-between overflow-hidden rounded-[18px] p-3 text-left",
        "border border-black/[0.06] bg-white/55 backdrop-blur-[2px]",
        "transition-[border-color,box-shadow,background-color] duration-300 ease-out",
        "hover:border-black/[0.09] hover:bg-white/80 hover:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15",
        "disabled:pointer-events-none disabled:opacity-40",
        active &&
          "border-black/[0.1] bg-white shadow-[0_10px_28px_-18px_rgba(15,23,42,0.28)] ring-1 ring-inset ring-black/[0.06]",
      )}
    >
      <span
        className={cn(
          "text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400",
          active && "text-slate-500",
        )}
      >
        {kind === "invoice" ? "Facture" : "Bon"}
      </span>

      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2",
          "text-slate-300/90 transition-colors duration-300 group-hover:text-slate-400/90",
          active && "text-slate-400",
        )}
        aria-hidden
      >
        <FileText className="h-7 w-7" strokeWidth={1.15} />
      </span>

      <span className="relative z-[1] min-w-0">
        <span className="block truncate text-[12px] font-medium leading-tight tracking-[-0.02em] text-slate-800">
          {title}
        </span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[10px] tabular-nums text-slate-400">{meta}</span>
        ) : null}
      </span>
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={outfit}
      className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400/90"
    >
      {children}
    </p>
  );
}

/** Rail droit page 5 — liste plein écran ; PDF en overlay + fermeture. */
export default function ChatbotDocumentsRightPanel() {
  const {
    companyId,
    chatbotInvoices,
    chatbotInvoicesLoading,
    supplierOrders,
    documentPreview,
    openDocumentPreview,
    openSupplierOrderPdf,
    closeDocumentPreview,
  } = useChatbotContext();

  const selectedKey = resolveSelectedKey(documentPreview);
  const previewOpen = isPreviewOverlayForTarget(documentPreview, "right");

  const supplierRows = useMemo(() => supplierOrders.slice(0, 20), [supplierOrders]);

  const docCount = chatbotInvoices.length + supplierRows.length;
  const hasList = docCount > 0;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="chatbot-documents-right-panel"
      style={outfit}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-medium tracking-[-0.02em] text-slate-800">Documents</h2>
            {hasList ? (
              <span className="text-[10px] tabular-nums text-slate-400">{docCount}</span>
            ) : null}
          </div>
        </div>

        <div
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4"
          data-testid="chatbot-documents-list"
        >
          {chatbotInvoicesLoading ? (
            <div className="flex justify-center py-10" data-testid="chatbot-documents-loading">
              <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
            </div>
          ) : !hasList ? (
            <p
              className="py-12 text-center text-[12px] leading-relaxed text-slate-400"
              data-testid="chatbot-documents-empty"
            >
              Aucun PDF pour l&apos;instant.
            </p>
          ) : (
            <div className="space-y-5">
              {chatbotInvoices.length > 0 ? (
                <section data-testid="chatbot-documents-section-invoices">
                  <SectionLabel>Factures</SectionLabel>
                  <ul className="grid grid-cols-2 gap-2.5" data-testid="chatbot-documents-grid-invoices">
                    {chatbotInvoices.map((row) => {
                      const key = `invoice:${row.interventionId}`;
                      return (
                        <li key={key} className="min-w-0">
                          <DocumentTile
                            testId={`chatbot-document-invoice-${row.interventionId}`}
                            active={selectedKey === key}
                            kind="invoice"
                            title={row.clientLabel}
                            meta={[formatWhen(row.invoicedAt), formatEur(row.totalCents)]
                              .filter(Boolean)
                              .join(" · ")}
                            onClick={() => openDocumentPreview(row.interventionId, "invoice")}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              {supplierRows.length > 0 ? (
                <section data-testid="chatbot-documents-section-orders">
                  <SectionLabel>Commandes</SectionLabel>
                  <ul className="grid grid-cols-2 gap-2.5" data-testid="chatbot-documents-grid-orders">
                    {supplierRows.map((order) => {
                      const key = `supplier:${order.id}`;
                      return (
                        <li key={key} className="min-w-0">
                          <DocumentTile
                            testId={`chatbot-document-order-${order.id}`}
                            active={selectedKey === key}
                            disabled={!companyId}
                            kind="order"
                            title={supplierOrderTitle(order)}
                            meta={[formatWhen(order.createdAt), formatEur(order.totalCents)]
                              .filter(Boolean)
                              .join(" · ")}
                            onClick={() => {
                              if (!companyId) return;
                              void openSupplierOrderPdf(companyId, order.id);
                            }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {previewOpen ? (
        <ChatbotPdfPreviewOverlay
          title={documentPreview.title}
          loading={documentPreview.loading}
          error={documentPreview.error}
          blobUrl={documentPreview.blobUrl}
          onClose={closeDocumentPreview}
          testIdPrefix="chatbot-documents"
        />
      ) : null}
    </div>
  );
}
