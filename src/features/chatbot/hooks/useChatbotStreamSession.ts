"use client";

import { useRef } from "react";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";
import type { UseChatbotStreamSessionArgs } from "@/features/chatbot/chatbotStreamSessionTypes";
import { useChatbotStreamBillingSync } from "@/features/chatbot/hooks/useChatbotStreamBillingSync";
import { useChatbotStreamDocumentAction } from "@/features/chatbot/hooks/useChatbotStreamDocumentAction";
import { useChatbotStreamEventHandler } from "@/features/chatbot/hooks/useChatbotStreamEventHandler";
import { useChatbotStreamRun } from "@/features/chatbot/hooks/useChatbotStreamRun";

export function useChatbotStreamSession(args: UseChatbotStreamSessionArgs) {
  const streamQuickActionsRef = useRef<ChatbotQuickAction[]>([]);

  const { syncAssistantBillingPanel } = useChatbotStreamBillingSync(args);

  const handleStreamEvent = useChatbotStreamEventHandler({
    ...args,
    streamQuickActionsRef,
  });

  const runStream = useChatbotStreamRun({
    ...args,
    handleStreamEvent,
    syncAssistantBillingPanel,
    streamQuickActionsRef,
  });

  const runDocumentAction = useChatbotStreamDocumentAction({
    ...args,
    handleStreamEvent,
  });

  return { runStream, runDocumentAction };
}
