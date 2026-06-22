"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildPendingInterventionIdsFromAssistant,
  extractInterventionIdFromInvoiceReply,
  shouldAutoPreviewInvoiceInPanel,
} from "@/features/chatbot/chatbot-address-disambiguation";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot/hooks/useWorkspaceCopilotSnapshot";
import type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotStreamEvent,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";
import type { ChatbotClientDocumentAction } from "@/features/chatbot/chatbot-client-document";
import { logCrmAfterDocumentBilling } from "@/features/crmHistory/logCrmAfterDocumentBilling";
import { isChatbotZeroTokenUiTool } from "@/features/chatbot/chatbot-document-side-effect";
import { useChatbotDocumentPreview } from "@/features/chatbot/hooks/useChatbotDocumentPreview";
import { useChatbotSupplierOrdersPanel } from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanel";
import { useChatbotInvoicesPanel } from "@/features/chatbot/hooks/useChatbotInvoicesPanel";
import { isChatbotConfirmationUtterance } from "@/features/chatbot/chatbot-confirm-utterance";
import { isChatbotPwaPendingToolId } from "@/features/chatbot/chatbot-pwa-intent";
import { countChatbotUserTurns } from "@/features/chatbot/chatbot-latency";
import {
  normalizeStoredMessages,
  type ChatbotVisionContent,
} from "@/features/chatbot/chatbot-stored-messages";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import {
  deriveChatbotQuickActions,
  mergeQuickActions,
  type ChatbotQuickAction,
} from "@/features/chatbot/chatbot-quick-actions";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRMSLOT_FOCUS_STOCK_HUB_EVENT } from "@/context/CompanyStockIntentContext";

const STORAGE_PREFIX = "crmslot-chatbot-v2";
function loadConversations(key: string): ChatbotConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatbotConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(key: string, rows: ChatbotConversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 30)));
  } catch {
    /* quota */
  }
}

async function readChatbotStream(
  res: Response,
  onEvent: (ev: ChatbotStreamEvent) => void
): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Erreur HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = json.error || json.message || message;
    } catch {
      if (text.trim()) message = text.slice(0, 400);
    }
    onEvent({ type: "error", message });
    return;
  }

  if (!res.body) throw new Error("Réponse vide du serveur");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onEvent(JSON.parse(line) as ChatbotStreamEvent);
      } catch {
        /* ligne non JSON */
      }
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as ChatbotStreamEvent);
    } catch {
      /* ignore */
    }
  }
}

function resolveCompanyId(
  workspace: ReturnType<typeof useCompanyWorkspaceOptional>
): string | null {
  return (workspace?.activeCompanyId ?? "").trim() || null;
}

export function useChatbot() {
  const pager = useDashboardPagerOptional();
  const documentPreviewApi = useChatbotDocumentPreview();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = resolveCompanyId(workspace);
  const uid = workspace?.firebaseUid ?? "anon";
  const isMobile = useIsMobile();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const documentVisible = useDocumentPageVisible();
  const [streaming, setStreaming] = useState(false);
  const workspaceReady = workspace?.workspaceReady === true;
  const hasDocumentPreview = Boolean(documentPreviewApi.documentPreview.interventionId?.trim());
  const documentLibraryEnabled = Boolean(
    companyId &&
    workspaceReady &&
    documentVisible &&
    (isMobile !== true ||
      (powerGate.documentsTabActive && powerGate.inboxDataActive) ||
      hasDocumentPreview ||
      streaming)
  );

  const supplierOrdersPanelApi = useChatbotSupplierOrdersPanel(
    companyId,
    uid,
    documentLibraryEnabled
  );

  const chatbotBackgroundEnabled =
    documentVisible &&
    (isMobile !== true ||
      streaming ||
      supplierOrdersPanelApi.supplierOrdersPanel.open ||
      Boolean(documentPreviewApi.documentPreview.interventionId?.trim()));

  const invoicesPanelApi = useChatbotInvoicesPanel(companyId, documentLibraryEnabled);
  const companyName =
    workspace?.memberships.find((m) => m.companyId === companyId)?.companyName ?? null;
  const role = workspace?.activeRole ?? null;
  const { snapshot: workspaceSnapshot } = useWorkspaceCopilotSnapshot({
    enabled: chatbotBackgroundEnabled,
  });

  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${uid}:${companyId ?? "none"}`,
    [uid, companyId]
  );

  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [pendingTool, setPendingTool] = useState<ChatbotPendingTool | null>(null);
  const [activeTool, setActiveTool] = useState<{ tool: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
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

      documentPreviewApi.openDocumentPreview(interventionId, "invoice", true);
      supplierOrdersPanelApi.ensureRightPanelOpen();
    },
    [documentPreviewApi, supplierOrdersPanelApi, workspaceSnapshot]
  );

  useEffect(() => {
    const rows = loadConversations(storageKey);
    setConversations(rows);
    setActiveId(rows[0]?.id ?? null);
    setPendingTool(null);
    setError(null);
  }, [storageKey]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const persist = useCallback(
    (rows: ChatbotConversation[]) => {
      setConversations(rows);
      saveConversations(storageKey, rows);
    },
    [storageKey]
  );

  const appendToConversation = useCallback(
    (
      convId: string,
      patch: {
        uiMessages?: ChatbotUiMessage[];
        apiMessages?: unknown[];
        title?: string;
      }
    ) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: patch.uiMessages ?? c.messages,
                apiMessages: patch.apiMessages ?? c.apiMessages,
                title: patch.title ?? c.title,
                updatedAt: Date.now(),
              }
            : c
        );
        saveConversations(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const newConversation = useCallback(() => {
    const conv: ChatbotConversation = {
      id: crypto.randomUUID(),
      title: "Nouvelle conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      apiMessages: [],
    };
    persist([conv, ...conversations]);
    setActiveId(conv.id);
    setPendingTool(null);
    setStreamingText("");
    setError(null);
  }, [conversations, persist]);

  const handleStreamEvent = useCallback(
    (
      ev: ChatbotStreamEvent,
      ctx: {
        accText: { v: string };
        nextApi: { v: unknown[] };
        streamError: { v: string | null };
      }
    ) => {
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
        // L'IA génère ou met à jour le PDF, on force le rafraichissement du cache
        documentPreviewApi.openDocumentPreview(ev.interventionId, ev.documentType, true);
        supplierOrdersPanelApi.ensureRightPanelOpen();
      }
      if (ev.type === "supplier_orders_panel") {
        supplierOrdersPanelApi.openSupplierOrdersPanel(
          ev.highlightOrderId,
          ev.materialOrderId,
          ev.previewOrder
        );
      }
      if (ev.type === "supplier_order_pdf") {
        supplierOrdersPanelApi.openSupplierOrdersPanel(ev.orderId, null);
        supplierOrdersPanelApi.ensureRightPanelOpen();
        void documentPreviewApi.openSupplierOrderPdf(ev.companyId, ev.orderId, true);
      }
      if (ev.type === "registry_refresh") {
        void supplierOrdersPanelApi.refreshRegistry();
      }
      if (ev.type === "focus_stock_hub") {
        pager?.setPageIndex(FEATURE_HUB_SLOT_INDEX);
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
    [documentPreviewApi, supplierOrdersPanelApi, pager]
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
            focusInterventionId: documentPreviewApi.documentPreview.interventionId?.trim() || null,
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
            saveConversations(storageKey, next);
            return next;
          });
        } else if (trimmedApi.length > normalizeStoredMessages(apiHistory).length) {
          setConversations((prev) => {
            const next = prev.map((c) =>
              c.id === convId ? { ...c, apiMessages: trimmedApi, updatedAt: Date.now() } : c
            );
            saveConversations(storageKey, next);
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
      handleStreamEvent,
      role,
      storageKey,
      syncAssistantBillingPanel,
      workspaceSnapshot,
    ]
  );

  /** PDF / facture via API PWA — aucun token OpenAI. */
  const runDocumentAction = useCallback(
    async (action: ChatbotClientDocumentAction, convId?: string | null) => {
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
    [activeId, appendToConversation, companyId, conversations, handleStreamEvent, role]
  );

  const confirmPendingTool = useCallback(async () => {
    if (!pendingTool || !companyId || !activeId) return;
    const tool = pendingTool;
    setPendingTool(null);

    if (isChatbotPwaPendingToolId(tool.toolUseId) && tool.name === "patch_intervention_billing") {
      const interventionId = String(tool.input.interventionId ?? "").trim();
      if (!interventionId) return;
      await runDocumentAction(
        {
          action: "patch",
          interventionId,
          lineIndex: typeof tool.input.lineIndex === "number" ? tool.input.lineIndex : undefined,
          unitPriceEur:
            typeof tool.input.unitPriceEur === "number" ? tool.input.unitPriceEur : undefined,
          clientName: typeof tool.input.clientName === "string" ? tool.input.clientName : undefined,
          previewDocumentType: tool.input.previewDocumentType === "quote" ? "quote" : "invoice",
        },
        activeId
      );
      return;
    }

    const conv = conversations.find((c) => c.id === activeId);
    const apiHistory = conv?.apiMessages ?? [];
    await runStream(activeId, apiHistory, {
      confirmTool: {
        toolUseId: tool.toolUseId,
        name: tool.name,
        input: tool.input,
      },
    });
  }, [activeId, companyId, conversations, pendingTool, runDocumentAction, runStream]);

  const sendMessage = useCallback(
    async (text: string, imageDataUrl?: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      if (pendingTool && isChatbotConfirmationUtterance(trimmed)) {
        await confirmPendingTool();
        return;
      }

      if (!companyId) {
        setError("Sélectionnez une société active pour utiliser le Chatbot.");
        return;
      }

      let convId = activeId;
      if (!convId) {
        const conv: ChatbotConversation = {
          id: crypto.randomUUID(),
          title: trimmed.slice(0, 48),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          apiMessages: [],
        };
        persist([conv, ...conversations]);
        convId = conv.id;
        setActiveId(convId);
      }

      const userMsg: ChatbotUiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      const conv =
        conversations.find((c) => c.id === convId) ??
        ({
          id: convId,
          title: trimmed.slice(0, 48),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          apiMessages: [],
        } satisfies ChatbotConversation);

      const nextUi = [...conv.messages, userMsg];
      const userApiContent: string | ChatbotVisionContent = imageDataUrl
        ? [
            { type: "text" as const, text: trimmed },
            {
              type: "image_url" as const,
              image_url: { url: imageDataUrl },
            },
          ]
        : trimmed;
      const nextApi = [...(conv.apiMessages ?? []), { role: "user", content: userApiContent }];

      appendToConversation(convId, { uiMessages: nextUi, apiMessages: nextApi });

      await runStream(convId, nextApi);
    },
    [
      activeId,
      appendToConversation,
      companyId,
      confirmPendingTool,
      conversations,
      isMobile,
      pendingTool,
      persist,
      runStream,
      streaming,
    ]
  );

  const cancelPendingTool = useCallback(() => {
    if (!activeId) return;
    setPendingTool(null);
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    appendToConversation(activeId, {
      uiMessages: [
        ...conv.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Action annulée — aucune modification n'a été effectuée.",
          createdAt: Date.now(),
        },
      ],
    });
  }, [activeId, appendToConversation, conversations]);

  return {
    companyId,
    companyName,
    workspaceSnapshot,
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    newConversation,
    sendMessage,
    streaming,
    streamingText,
    activeTool,
    pendingTool,
    confirmPendingTool,
    cancelPendingTool,
    error,
    runDocumentAction,
    isZeroTokenUiTool: isChatbotZeroTokenUiTool,
    chatbotInvoices: invoicesPanelApi.invoices,
    chatbotInvoicesLoading: invoicesPanelApi.loading,
    ...documentPreviewApi,
    ...supplierOrdersPanelApi,
  };
}
