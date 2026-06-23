"use client";

import { useCallback, useRef } from "react";
import {
  buildPendingInterventionIdsFromAssistant,
  extractInterventionIdFromInvoiceReply,
  shouldAutoPreviewInvoiceInPanel,
} from "@/features/chatbot/chatbot-address-disambiguation";
import type { ChatbotUiMessage } from "@/features/chatbot/chatbot-types";
import type { UseChatbotStreamSessionArgs } from "@/features/chatbot/chatbotStreamSessionTypes";

type UseChatbotStreamBillingSyncArgs = Pick<
  UseChatbotStreamSessionArgs,
  "workspaceSnapshot" | "openDocumentPreview" | "ensureRightPanelOpen"
>;

export function useChatbotStreamBillingSync({
  workspaceSnapshot,
  openDocumentPreview,
  ensureRightPanelOpen,
}: UseChatbotStreamBillingSyncArgs) {
  const pendingBillingChoiceIdsRef = useRef<string[] | null>(null);

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

  return { syncAssistantBillingPanel, pendingBillingChoiceIdsRef };
}
