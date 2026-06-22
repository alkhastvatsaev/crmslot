"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot/hooks/useWorkspaceCopilotSnapshot";
import type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";
import { isChatbotZeroTokenUiTool } from "@/features/chatbot/chatbot-document-side-effect";
import { useChatbotDocumentPreview } from "@/features/chatbot/hooks/useChatbotDocumentPreview";
import { useChatbotSupplierOrdersPanel } from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanel";
import { isChatbotConfirmationUtterance } from "@/features/chatbot/chatbot-confirm-utterance";
import { isChatbotPwaPendingToolId } from "@/features/chatbot/chatbot-pwa-intent";
import type { ChatbotVisionContent } from "@/features/chatbot/chatbot-stored-messages";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";
import {
  loadChatbotConversations,
  saveChatbotConversations,
} from "@/features/chatbot/chatbotConversationStorage";
import { useChatbotStreamSession } from "@/features/chatbot/hooks/useChatbotStreamSession";
import { useChatbotInvoicesPanel } from "@/features/chatbot/hooks/useChatbotInvoicesPanel";

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
    () => `crmslot-chatbot-v2:${uid}:${companyId ?? "none"}`,
    [uid, companyId]
  );

  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [pendingTool, setPendingTool] = useState<ChatbotPendingTool | null>(null);
  const [activeTool, setActiveTool] = useState<{ tool: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rows = loadChatbotConversations(storageKey);
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
      saveChatbotConversations(storageKey, rows);
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
        saveChatbotConversations(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const { runStream, runDocumentAction: runDocumentActionInner } = useChatbotStreamSession({
    companyId,
    companyName,
    role,
    storageKey,
    conversations,
    setConversations,
    workspaceSnapshot,
    focusInterventionId: documentPreviewApi.documentPreview.interventionId?.trim() || null,
    appendToConversation,
    openDocumentPreview: documentPreviewApi.openDocumentPreview,
    openSupplierOrdersPanel: supplierOrdersPanelApi.openSupplierOrdersPanel,
    ensureRightPanelOpen: supplierOrdersPanelApi.ensureRightPanelOpen,
    refreshRegistry: supplierOrdersPanelApi.refreshRegistry,
    openSupplierOrderPdf: documentPreviewApi.openSupplierOrderPdf,
    setPageIndex: pager?.setPageIndex,
    setStreaming,
    setStreamingText,
    setActiveTool,
    setPendingTool,
    setError,
  });

  const runDocumentAction = useCallback(
    (action: Parameters<typeof runDocumentActionInner>[0], convId?: string | null) =>
      runDocumentActionInner(action, convId, activeId),
    [activeId, runDocumentActionInner]
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
