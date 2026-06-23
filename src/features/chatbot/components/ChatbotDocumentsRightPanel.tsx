"use client";

import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  formatEur,
  formatWhen,
  supplierOrderTitle,
} from "@/features/chatbot/chatbotDocumentsPanelHelpers";
import { ChatbotDocumentTile } from "@/features/chatbot/components/ChatbotDocumentTile";
import ChatbotPdfPreviewOverlay from "@/features/chatbot/components/ChatbotPdfPreviewOverlay";
import { useChatbotDocumentsRightPanelController } from "@/features/chatbot/hooks/useChatbotDocumentsRightPanelController";
import { useTranslation } from "@/core/i18n/I18nContext";

/** Rail droit page 5 — liste plein écran ; PDF en overlay + fermeture. */
export default function ChatbotDocumentsRightPanel() {
  const { t } = useTranslation();
  const {
    companyId,
    chatbotInvoicesLoading,
    documentPreview,
    openDocumentPreview,
    openSupplierOrderPdf,
    closeDocumentPreview,
    searchQuery,
    setSearchQuery,
    selectedKey,
    previewOpen,
    parsedSearch,
    documentItems,
    docCount,
    libraryCount,
    hasLibrary,
    hasList,
    showSearchNoResults,
    thumbnails,
    thumbnailLoading,
    invoiceClientLabel,
    supplierOrderClientLabel,
    invoiceTileKey,
    supplierTileKey,
  } = useChatbotDocumentsRightPanelController();

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="chatbot-documents-right-panel"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-3 px-4 pt-4 pb-3">
          <h2 className="sr-only">{t("chatbot.documents_heading")}</h2>
          {hasLibrary ? (
            <span className="sr-only" data-testid="chatbot-documents-count">
              {parsedSearch.hasQuery ? `${docCount}/${libraryCount}` : libraryCount}
            </span>
          ) : null}
          <div className="relative" data-testid="chatbot-documents-search">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={String(t("chat.documents_search_placeholder"))}
              aria-label={String(t("chat.documents_search_aria"))}
              className="h-9 rounded-[14px] border-slate-200/80 bg-white/90 pr-9 pl-9 text-[12px] shadow-sm placeholder:text-slate-400"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                data-testid="chatbot-documents-search-clear"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={String(t("chat.documents_search_clear"))}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
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
          ) : showSearchNoResults ? (
            <p
              className="py-12 text-center text-[12px] leading-relaxed text-slate-400"
              data-testid="chatbot-documents-no-results"
            >
              {t("chat.documents_no_results")}
            </p>
          ) : !hasList ? (
            <p
              className="py-12 text-center text-[12px] leading-relaxed text-slate-400"
              data-testid="chatbot-documents-empty"
            >
              {t("chatbot.documents_empty")}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2.5" data-testid="chatbot-documents-grid">
              {documentItems.map((item) => {
                if (item.kind === "invoice") {
                  const row = item.invoice;
                  const key = `invoice:${row.interventionId}`;
                  return (
                    <li key={key} className="min-w-0">
                      <ChatbotDocumentTile
                        testId={`chatbot-document-invoice-${row.interventionId}`}
                        active={selectedKey === key}
                        kind="invoice"
                        title={invoiceClientLabel(row.interventionId, row.clientLabel)}
                        subtitle={row.problem?.trim() || undefined}
                        meta={[formatWhen(row.invoicedAt), formatEur(row.totalCents)]
                          .filter(Boolean)
                          .join(" · ")}
                        thumbnailUrl={thumbnails[invoiceTileKey(row.interventionId)]?.thumbnailUrl}
                        thumbnailLoading={thumbnailLoading[invoiceTileKey(row.interventionId)]}
                        onClick={() => openDocumentPreview(row.interventionId, "invoice")}
                      />
                    </li>
                  );
                }

                const order = item.order;
                const key = `supplier:${order.id}`;
                return (
                  <li key={key} className="min-w-0">
                    <ChatbotDocumentTile
                      testId={`chatbot-document-order-${order.id}`}
                      active={selectedKey === key}
                      disabled={!companyId}
                      kind="order"
                      title={supplierOrderClientLabel(order)}
                      subtitle={supplierOrderTitle(order)}
                      meta={[formatWhen(order.createdAt), formatEur(order.totalCents)]
                        .filter(Boolean)
                        .join(" · ")}
                      thumbnailUrl={thumbnails[supplierTileKey(order.id)]?.thumbnailUrl}
                      thumbnailLoading={thumbnailLoading[supplierTileKey(order.id)]}
                      onClick={() => {
                        if (!companyId) return;
                        void openSupplierOrderPdf(companyId, order.id);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
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
