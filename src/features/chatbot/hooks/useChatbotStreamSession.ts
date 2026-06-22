"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import {
  buildPendingInterventionIdsFromAssistant,
  extractInterventionIdFromInvoiceReply,
  shouldAutoPreviewInvoiceInPanel,
} from "@/features/chatbot/chatbot-address-disambiguation";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotStreamEvent,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";
import type { ChatbotClientDocumentAction } from "@/features/chatbot/chatbot-client-document";
import { logCrmAfterDocumentBilling } from "@/features/crmHistory/logCrmAfterDocumentBilling";
import { countChatbotUserTurns } from "@/features/chatbot/chatbot-latency";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import {
  deriveChatbotQuickActions,
  mergeQuickActions,
  type ChatbotQuickAction,
} from "@/features/chatbot/chatbot-quick-actions";
import { readChatbotStream } from "@/features/chatbot/readChatbotStream";
import { saveChatbotConversations } from "@/features/chatbot/chatbotConversationStorage";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRMSLOT_FOCUS_STOCK_HUB_EVENT } from "@/context/CompanyStockIntentContext";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";
import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";

type StreamCtx = {
  accText: { v: string };
  nextApi: { v: unknown[] };
  streamError: { v: string | null };
};

type UseChatbotStreamSessionArgs = {
  companyId: string | null;
  companyName: string | null;
  role: string | null;
  storageKey: string;
  conversations: ChatbotConversation[];
  setConversations: Dispatch<SetStateAction<ChatbotConversation[]>>;
  workspaceSnapshot: WorkspaceCopilotSnapshot | null | undefined;
  focusInterventionId: string | null;
  appendToConversation: (
    convId: string,
    patch: {
      uiMessages?: ChatbotUiMessage[];
      apiMessages?: unknown[];
      title?: string;
    }
  ) => void;
  openDocumentPreview: (
    interventionId: string,
    documentType: ChatbotDocumentKind,
    force?: boolean
  ) => void;
  openSupplierOrdersPanel: (
    highlightOrderId?: string | null,
    materialOrderId?: string | null,
    previewOrder?: boolean
  ) => void;
  ensureRightPanelOpen: () => void;
  refreshRegistry: () => void;
  openSupplierOrderPdf: (companyId: string, orderId: string, force?: boolean) => Promise<void>;
  setPageIndex: ((index: number) => void) | undefined;
  setStreaming: Dispatch<SetStateAction<boolean>>;
  setStreamingText: Dispatch<SetStateAction<string>>;
  setActiveTool: Dispatch<SetStateAction<{ tool: string; label: string } | null>>;
  setPendingTool: Dispatch<SetStateAction<ChatbotPendingTool | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function useChatbotStreamSession({
  companyId,
  companyName,
  role,
  storageKey,
  conversations,
  setConversations,
  workspaceSnapshot,
  focusInterventionId,
  appendToConversation,
  openDocumentPreview,
  openSupplierOrdersPanel,
  ensureRightPanelOpen,
  refreshRegistry,
  openSupplierOrderPdf,
  setPageIndex,
  setStreaming,
  setStreamingText,
  setActiveTool,
  setPendingTool,
  setError,
}: UseChatbotStreamSessionArgs) {
  const pendingBillingChoiceIdsRef = useRef<string[] | null>(null);
  const streamQuickActionsRef = useRef<ChatbotQuickAction[]>([]);

  const syncAssistantBillingPanel = useCallback(
    (assistantText: string, uiMessages: ChatbotUiMessage[]) => {
      const pending = buildPendingInterventionIdsFromAssistant(
        assistantText,
        workspaceSnapshot,
        uiMessages
      );
      if (pending) {
        pendingBillingChoiceIdsRef.current = pending;
        return;
      }
      pendingBillingChoiceIdsRef.current = null;
      if (!shouldAutoPreviewInvoiceInPanel(assistantText)) return;

      const interventionId = extractInterventionIdFromInvoiceReply(
        assistantText,
        workspaceSnapshot,
        uiMessages,
        null
      );
      if (!interventionId) return;

      openDocumentPreview(interventionId, "invoice", true);
      ensureRightPanelOpen();
    },
    [ensureRightPanelOpen, openDocumentPreview, workspaceSnapshot]
  );

  const handleStreamEvent = useCallback(
    (ev: ChatbotStreamEvent, ctx: StreamCtx) => {
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
    ]
  );

  const runStream = useCallback(
    async (
      convId: string,
      apiHistory: unknown[],
      extra?: {
        confirmTool?: { toolUseId: string; name: string; input: Record<string, unknown> };
        toolScope?: string[];
        omitWorkspaceSnapshot?: boolean;
      }
    ) => {
      if (!companyId) {
        setError("Sélectionnez une société active (switcher en haut) pour utiliser le Chatbot.");
        return;
      }

      setStreaming(true);
      setStreamingText("");
      setActiveTool(null);
      setError(null);
      streamQuickActionsRef.current = [];

      const accText = { v: "" };
      const streamError = { v: null as string | null };
      const nextApi = { v: apiHistory as unknown[] };

      try {
        const includeSnapshot =
          !extra?.omitWorkspaceSnapshot &&
          countChatbotUserTurns(apiHistory) <= 1 &&
          workspaceSnapshot != null;

        const res = await fetchWithAuth("/api/ai/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            companyName,
            role,
            messages: apiHistory,
            workspaceSnapshot: includeSnapshot ? workspaceSnapshot : undefined,
            toolScope: extra?.toolScope,
            focusInterventionId,
            conversationId: convId,
            ...extra,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Erreur ${res.status}: ${body.slice(0, 200)}`);
        }

        await readChatbotStream(res, (ev) =>
          handleStreamEvent(ev, { accText, nextApi, streamError })
        );

        const finalText = (accText.v.trim() || streamError.v || "").trim();
        const trimmedApi = trimChatbotMessagesForApi(normalizeStoredMessages(nextApi.v));
        if (finalText) {
          const conv = conversations.find((c) => c.id === convId);
          const derived = deriveChatbotQuickActions(finalText);
          const actions = mergeQuickActions(streamQuickActionsRef.current, derived);
          streamQuickActionsRef.current = [];
          const assistantMsg: ChatbotUiMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalText,
            createdAt: Date.now(),
            ...(actions.length > 0 ? { actions } : {}),
          };
          const uiMessages = [...(conv?.messages ?? []), assistantMsg];
          syncAssistantBillingPanel(finalText, uiMessages);
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: uiMessages,
                    apiMessages: trimmedApi,
                    updatedAt: Date.now(),
                    title:
                      c.title === "Nouvelle conversation" && uiMessages[0]
                        ? uiMessages[0].content.slice(0, 48)
                        : c.title,
                  }
                : c
            );
            saveChatbotConversations(storageKey, next);
            return next;
          });
        } else if (trimmedApi.length > normalizeStoredMessages(apiHistory).length) {
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === convId ? { ...c, apiMessages: trimmedApi, updatedAt: Date.now() } : c
            );
            saveChatbotConversations(storageKey, next);
            return next;
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur réseau Chatbot";
        setError(msg);
        appendToConversation(convId, {
          uiMessages: [
            ...(conversations.find((c) => c.id === convId)?.messages ?? []),
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `⚠️ ${msg}`,
              createdAt: Date.now(),
            },
          ],
        });
      } finally {
        setStreaming(false);
        setStreamingText("");
        setActiveTool(null);
      }
    },
    [
      appendToConversation,
      companyId,
      companyName,
      conversations,
      focusInterventionId,
      handleStreamEvent,
      role,
      setActiveTool,
      setConversations,
      setError,
      setStreaming,
      setStreamingText,
      storageKey,
      syncAssistantBillingPanel,
      workspaceSnapshot,
    ]
  );

  const runDocumentAction = useCallback(
    async (
      action: ChatbotClientDocumentAction,
      convId?: string | null,
      activeId?: string | null
    ) => {
      if (!companyId) {
        setError("Sélectionnez une société active pour utiliser le Chatbot.");
        return;
      }

      const targetId = convId ?? activeId;
      setStreaming(true);
      setStreamingText("");
      setError(null);

      const accText = { v: "" };
      const streamError = { v: null as string | null };
      const nextApi = { v: [] as unknown[] };

      try {
        const res = await fetchWithAuth("/api/ai/chatbot/document-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyId, role, ...action }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Erreur ${res.status}: ${body.slice(0, 200)}`);
        }

        await readChatbotStream(res, (ev) =>
          handleStreamEvent(ev, { accText, nextApi, streamError })
        );

        if (!streamError.v && (action.action === "patch" || action.action === "append_billing")) {
          void logCrmAfterDocumentBilling(action, companyId);
        }

        const finalText = (accText.v.trim() || streamError.v || "").trim();
        if (finalText && targetId) {
          const conv = conversations.find((c) => c.id === targetId);
          if (conv) {
            appendToConversation(targetId, {
              uiMessages: [
                ...conv.messages,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: finalText,
                  createdAt: Date.now(),
                },
              ],
            });
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur document";
        setError(msg);
      } finally {
        setStreaming(false);
        setStreamingText("");
      }
    },
    [
      appendToConversation,
      companyId,
      conversations,
      handleStreamEvent,
      role,
      setError,
      setStreaming,
      setStreamingText,
    ]
  );

  return { runStream, runDocumentAction };
}
