"use client";

import { useCallback } from "react";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRMSLOT_FOCUS_STOCK_HUB_EVENT } from "@/context/CompanyStockIntentContext";
import type {
  ChatbotStreamCtx,
  ChatbotStreamEvent,
  ChatbotStreamEventHandlerDeps,
} from "@/features/chatbot/chatbotStreamSessionTypes";

export function useChatbotStreamEventHandler(deps: ChatbotStreamEventHandlerDeps) {
  const {
    ensureRightPanelOpen,
    openDocumentPreview,
    openSupplierOrderPdf,
    openSupplierOrdersPanel,
    refreshRegistry,
    setPageIndex,
    setActiveTool,
    setPendingTool,
    setStreamingText,
    setError,
    streamQuickActionsRef,
  } = deps;

  const handleStreamEvent = useCallback(
    (ev: ChatbotStreamEvent, ctx: ChatbotStreamCtx) => {
      if (ev.type === "text") {
        ctx.accText.v += ev.delta;
        setStreamingText(ctx.accText.v);
      }
      if (ev.type === "tool_start") {
        setActiveTool({ tool: ev.tool, label: ev.label });
      }
      if (ev.type === "tool_end") {
        setActiveTool(null);
      }
      if (ev.type === "tool_pending") {
        setPendingTool(ev.pending);
      }
      if (ev.type === "document_preview") {
        openDocumentPreview(ev.interventionId, ev.documentType, true);
        ensureRightPanelOpen();
      }
      if (ev.type === "supplier_orders_panel") {
        openSupplierOrdersPanel(ev.highlightOrderId, ev.materialOrderId, ev.previewOrder);
      }
      if (ev.type === "supplier_order_pdf") {
        openSupplierOrdersPanel(ev.orderId, null);
        ensureRightPanelOpen();
        void openSupplierOrderPdf(ev.companyId, ev.orderId, true);
      }
      if (ev.type === "registry_refresh") {
        void refreshRegistry();
      }
      if (ev.type === "focus_stock_hub") {
        setPageIndex?.(FEATURE_HUB_SLOT_INDEX);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(CRMSLOT_FOCUS_STOCK_HUB_EVENT, {
              detail: {
                stockItemId: ev.stockItemId ?? null,
                filter: ev.filter,
              },
            })
          );
        }
      }
      if (ev.type === "quick_actions" && ev.actions.length > 0) {
        streamQuickActionsRef.current = ev.actions;
      }
      if (ev.type === "done" && ev.apiMessages) {
        ctx.nextApi.v = ev.apiMessages;
      }
      if (ev.type === "error") {
        ctx.streamError.v = ev.message;
        setError(ev.message);
      }
    },
    [
      ensureRightPanelOpen,
      openDocumentPreview,
      openSupplierOrderPdf,
      openSupplierOrdersPanel,
      refreshRegistry,
      setActiveTool,
      setError,
      setPageIndex,
      setPendingTool,
      setStreamingText,
      streamQuickActionsRef,
    ]
  );

  return handleStreamEvent;
}
