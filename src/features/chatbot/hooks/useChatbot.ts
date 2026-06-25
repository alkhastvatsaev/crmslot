"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot";
import type { ChatbotPendingTool } from "@/features/chatbot/chatbot-types";
import { isChatbotZeroTokenUiTool } from "@/features/chatbot/chatbot-document-side-effect";
import { useChatbotDocumentPreview } from "@/features/chatbot/hooks/useChatbotDocumentPreview";
import { useChatbotSupplierOrdersPanel } from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanel";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useBillingHubIntentOptional } from "@/context/BillingHubIntentContext";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";
import { useChatbotStreamSession } from "@/features/chatbot/hooks/useChatbotStreamSession";
import { useChatbotInvoicesPanel } from "@/features/chatbot/hooks/useChatbotInvoicesPanel";
import { useChatbotConversations } from "@/features/chatbot/hooks/useChatbotConversations";
import { useChatbotMessaging } from "@/features/chatbot/hooks/useChatbotMessaging";

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
  const billingIntent = useBillingHubIntentOptional();
  const railSnapshot = useMobileHubRailSnapshot();
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const documentVisible = useDocumentPageVisible();
  const billingHubPageActive = pager?.pageIndex === BILLING_HUB_SLOT_INDEX;
  const billingHubDocumentsTab =
    billingHubPageActive && (billingIntent?.rightPanelTab ?? "documents") === "documents";
  const billingHubDocumentsRailActive =
    billingHubDocumentsTab && (isMobile !== true || railSnapshot?.activeRail === "right");
  const [streaming, setStreaming] = useState(false);
  const workspaceReady = workspace?.workspaceReady === true;
  const hasDocumentPreview = Boolean(documentPreviewApi.documentPreview.interventionId?.trim());
  const documentLibraryEnabled = Boolean(
    companyId &&
    workspaceReady &&
    documentVisible &&
    (isMobile !== true ||
      (powerGate.documentsTabActive && powerGate.inboxDataActive) ||
      billingHubDocumentsRailActive ||
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

  const [streamingText, setStreamingText] = useState("");
  const [pendingTool, setPendingTool] = useState<ChatbotPendingTool | null>(null);
  const [activeTool, setActiveTool] = useState<{ tool: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    conversations,
    setConversations,
    activeId,
    setActiveId,
    activeConversation,
    persist,
    appendToConversation,
    newConversation: createConversation,
  } = useChatbotConversations(storageKey);

  useEffect(() => {
    setPendingTool(null);
    setError(null);
  }, [storageKey]);

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

  const messaging = useChatbotMessaging({
    companyId,
    activeId,
    setActiveId,
    conversations,
    persist,
    appendToConversation,
    pendingTool,
    setPendingTool,
    setStreamingText,
    setError,
    streaming,
    runStream,
    runDocumentActionInner,
  });

  const newConversation = useCallback(() => {
    createConversation();
    messaging.startNewConversation();
  }, [createConversation, messaging.startNewConversation]);

  return {
    companyId,
    companyName,
    workspaceSnapshot,
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    newConversation,
    sendMessage: messaging.sendMessage,
    streaming,
    streamingText,
    activeTool,
    pendingTool,
    confirmPendingTool: messaging.confirmPendingTool,
    cancelPendingTool: messaging.cancelPendingTool,
    error,
    runDocumentAction: messaging.runDocumentAction,
    isZeroTokenUiTool: isChatbotZeroTokenUiTool,
    chatbotInvoices: invoicesPanelApi.invoices,
    chatbotInvoicesLoading: invoicesPanelApi.loading,
    ...documentPreviewApi,
    ...supplierOrdersPanelApi,
  };
}
