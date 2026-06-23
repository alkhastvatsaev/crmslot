"use client";

import ChatbotPdfPreviewOverlay from "@/features/chatbot/components/ChatbotPdfPreviewOverlay";
import ChatbotSupplierOrdersEmbeddedList from "@/features/chatbot/components/ChatbotSupplierOrdersEmbeddedList";
import ChatbotSupplierOrdersRightRailList from "@/features/chatbot/components/ChatbotSupplierOrdersRightRailList";
import {
  useChatbotSupplierOrdersPanelView,
  type ChatbotSupplierOrdersPlacement,
} from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanelView";
import { HUB_TYPE } from "@/core/ui/hub/hubTheme";

type ChatbotSupplierOrdersPanelProps = {
  placement?: ChatbotSupplierOrdersPlacement;
};

export default function ChatbotSupplierOrdersPanel({
  placement = "embedded",
}: ChatbotSupplierOrdersPanelProps) {
  const view = useChatbotSupplierOrdersPanelView(placement);
  const {
    t,
    isLeftRail,
    isRightRail,
    isSideRail,
    totalCount,
    previewOnSideRail,
    pendingEmailCount,
    registryError,
    supplierOrders,
    materialOrders,
    closeSupplierOrdersPanel,
    documentPreview,
    closeDocumentPreview,
  } = view;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid={
        isLeftRail
          ? "chatbot-orders-left-panel"
          : isRightRail
            ? "company-stock-orders-panel"
            : "chatbot-supplier-orders-panel"
      }
    >
      {isRightRail ? null : isSideRail ? (
        <div className="shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className={HUB_TYPE.eyebrow}>{t("chatbot.orders_heading")}</span>
            {totalCount > 0 ? (
              <span className="text-[11px] font-medium tabular-nums text-slate-400">
                {totalCount}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-2.5 pt-3">
          <h2 className={HUB_TYPE.title}>{t("chatbot.orders_and_slips_heading")}</h2>
          <button
            type="button"
            data-testid="chatbot-supplier-orders-close"
            onClick={closeSupplierOrdersPanel}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={String(t("chatbot.close_preview"))}
          >
            <span className="text-[16px] leading-none">×</span>
          </button>
        </header>
      )}

      <div
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto"
        data-testid="chatbot-orders-list"
      >
        {pendingEmailCount > 0 ? (
          <p
            className="mx-4 mb-2 mt-1 rounded-[12px] bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800"
            data-testid="chatbot-pending-email-banner"
          >
            ⚠ {pendingEmailCount} bon{pendingEmailCount > 1 ? "s" : ""} non envoyé
            {pendingEmailCount > 1 ? "s" : ""} — reconnectez Gmail pour les transmettre à Lecot.
          </p>
        ) : null}
        {registryError ? (
          <p
            className="mx-4 mb-2 mt-1 rounded-[12px] bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800"
            data-testid="chatbot-registry-error"
          >
            {registryError}
          </p>
        ) : null}

        {supplierOrders.length === 0 && materialOrders.length === 0 ? (
          <p
            className="px-4 py-10 text-center text-[12px] text-slate-400"
            data-testid="chatbot-supplier-orders-empty"
          >
            {t("chatbot.orders_empty")}
          </p>
        ) : null}

        {isRightRail ? (
          <ChatbotSupplierOrdersRightRailList view={view} />
        ) : (
          <ChatbotSupplierOrdersEmbeddedList view={view} />
        )}
      </div>

      {previewOnSideRail ? (
        <ChatbotPdfPreviewOverlay
          title={documentPreview.title}
          loading={documentPreview.loading}
          error={documentPreview.error}
          blobUrl={documentPreview.blobUrl}
          onClose={closeDocumentPreview}
          testIdPrefix={isRightRail ? "company-stock-orders" : "chatbot-orders"}
        />
      ) : null}
    </div>
  );
}
