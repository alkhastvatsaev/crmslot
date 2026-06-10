"use client";

import { useCallback, useMemo, useState } from "react";
import { FileText, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { isPreviewOverlayForTarget } from "@/features/chatbot/chatbot-document-preview-ui";
import {
  buildInterventionClientLabelMap,
  buildSupplierOrderClientNameByOrderId,
  buildSupplierOrderInterventionIdByOrderId,
  resolveSupplierOrderListClientLabel,
} from "@/features/chatbot/chatbotOrderClientLabels";
import ChatbotPdfPreviewOverlay from "@/features/chatbot/components/ChatbotPdfPreviewOverlay";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import {
  documentCreatedAtMs,
  filterChatbotInvoices,
  filterChatbotSupplierOrders,
  mergeChatbotDocumentsByCreatedAt,
  parseDocumentsSearchQuery,
} from "@/features/chatbot/filterChatbotDocuments";
import {
  invoiceTileKey,
  supplierTileKey,
  useChatbotDocumentTileThumbnails,
} from "@/features/chatbot/hooks/useChatbotDocumentTileThumbnails";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { SupplierOrder } from "@/features/suppliers/types";

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} €`;
}

function formatWhen(raw: unknown): string {
  const ms = documentCreatedAtMs(raw);
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

function supplierOrderTitle(order: SupplierOrder): string {
  const lines = order.lines ?? [];
  const first = lines[0]?.label?.trim();
  if (!first) return "Commande";
  if (lines.length === 1) return first;
  return first;
}

function resolveSelectedKey(preview: {
  kind: string;
  interventionId: string;
  supplierOrderId?: string | null;
  loading: boolean;
  blobUrl: string | null;
  error: string | null;
}): string | null {
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
  subtitle?: string;
  meta?: string;
  thumbnailUrl?: string | null;
  thumbnailLoading?: boolean;
  onClick: () => void;
};

function DocumentTile({
  testId,
  active,
  disabled,
  kind,
  title,
  subtitle,
  meta,
  thumbnailUrl,
  thumbnailLoading,
  onClick,
}: DocumentTileProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-[18px] text-left",
        "border border-black/[0.06] bg-white/55 backdrop-blur-[2px]",
        "transition-[border-color,box-shadow,background-color] duration-300 ease-out",
        "hover:border-black/[0.09] hover:bg-white/80 hover:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15",
        "disabled:pointer-events-none disabled:opacity-40",
        active &&
          "border-black/[0.1] bg-white shadow-[0_10px_28px_-18px_rgba(15,23,42,0.28)] ring-1 ring-inset ring-black/[0.06]"
      )}
    >
      <div className="relative size-full overflow-hidden bg-slate-100/80">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniature pdf.js
          <img
            data-testid={`${testId}-preview`}
            src={thumbnailUrl}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-cover object-top"
          />
        ) : (
          <span
            className={cn(
              "pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2",
              "text-slate-300/90 transition-colors duration-300 group-hover:text-slate-400/90",
              active && "text-slate-400"
            )}
            aria-hidden
          >
            {thumbnailLoading ? (
              <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.15} />
            ) : (
              <FileText className="h-7 w-7" strokeWidth={1.15} />
            )}
          </span>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm",
            active && "text-slate-600"
          )}
        >
          {kind === "invoice"
            ? String(t("chatbot.doc_badge_invoice"))
            : String(t("chatbot.doc_badge_order"))}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-white/95 via-white/85 to-transparent px-2 pb-1.5 pt-6">
        <span className="block truncate text-[12px] font-medium leading-tight tracking-[-0.02em] text-slate-800">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[10px] leading-tight text-slate-500">
            {subtitle}
          </span>
        ) : null}
        {meta ? (
          <span className="mt-0.5 block truncate text-[10px] tabular-nums text-slate-400">
            {meta}
          </span>
        ) : null}
      </div>
    </button>
  );
}

/** Rail droit page 5 — liste plein écran ; PDF en overlay + fermeture. */
export default function ChatbotDocumentsRightPanel() {
  const { t } = useTranslation();
  const {
    companyId,
    chatbotInvoices,
    chatbotInvoicesLoading,
    supplierOrders,
    materialOrders,
    workspaceSnapshot,
    documentPreview,
    openDocumentPreview,
    openSupplierOrderPdf,
    closeDocumentPreview,
  } = useChatbotContext();

  const workspace = useCompanyWorkspaceOptional();
  const interventionsCompanyId =
    (workspace?.isTenantUser ? workspace.activeCompanyId : null) ?? companyId;
  const { interventions } = useBackOfficeInterventions(interventionsCompanyId);

  const clientLabelByInterventionId = useMemo(
    () => buildInterventionClientLabelMap(chatbotInvoices, workspaceSnapshot, interventions),
    [chatbotInvoices, workspaceSnapshot, interventions]
  );

  const orderInterventionIdByOrderId = useMemo(
    () => buildSupplierOrderInterventionIdByOrderId(supplierOrders, materialOrders),
    [supplierOrders, materialOrders]
  );

  const clientNameBySupplierOrderId = useMemo(
    () => buildSupplierOrderClientNameByOrderId(supplierOrders, materialOrders),
    [supplierOrders, materialOrders]
  );

  const invoiceClientLabel = useCallback(
    (interventionId: string, fallback: string) =>
      clientLabelByInterventionId.get(interventionId)?.trim() || fallback,
    [clientLabelByInterventionId]
  );

  const supplierOrderClientLabel = useCallback(
    (order: SupplierOrder) =>
      resolveSupplierOrderListClientLabel(
        order,
        clientNameBySupplierOrderId,
        orderInterventionIdByOrderId,
        clientLabelByInterventionId
      ),
    [clientNameBySupplierOrderId, orderInterventionIdByOrderId, clientLabelByInterventionId]
  );

  const [searchQuery, setSearchQuery] = useState("");

  const selectedKey = resolveSelectedKey(documentPreview);
  const previewOpen = isPreviewOverlayForTarget(documentPreview, "right");

  const parsedSearch = useMemo(() => parseDocumentsSearchQuery(searchQuery), [searchQuery]);

  const filteredInvoices = useMemo(
    () => filterChatbotInvoices(chatbotInvoices, parsedSearch),
    [chatbotInvoices, parsedSearch]
  );

  const filteredOrders = useMemo(
    () => filterChatbotSupplierOrders(supplierOrders, parsedSearch),
    [supplierOrders, parsedSearch]
  );

  const documentItems = useMemo(
    () => mergeChatbotDocumentsByCreatedAt(filteredInvoices, filteredOrders),
    [filteredInvoices, filteredOrders]
  );

  const docCount = documentItems.length;
  const libraryCount = chatbotInvoices.length + supplierOrders.length;
  const hasLibrary = libraryCount > 0;
  const hasList = docCount > 0;
  const showSearchNoResults =
    parsedSearch.hasQuery && !chatbotInvoicesLoading && hasLibrary && !hasList;

  const filteredInvoiceIds = useMemo(
    () => filteredInvoices.map((row) => row.interventionId),
    [filteredInvoices]
  );
  const filteredOrderIds = useMemo(() => filteredOrders.map((order) => order.id), [filteredOrders]);
  const { thumbnails, thumbnailLoading } = useChatbotDocumentTileThumbnails(
    companyId,
    filteredInvoiceIds,
    filteredOrderIds
  );

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
                      <DocumentTile
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
                    <DocumentTile
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
