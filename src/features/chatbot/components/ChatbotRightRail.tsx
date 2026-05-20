"use client";

import { useEffect } from "react";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import ChatbotDocumentsRightPanel from "@/features/chatbot/components/ChatbotDocumentsRightPanel";

/** Rail droit — visualisation unique (PDF chatbot, commandes, factures). */
export default function ChatbotRightRail() {
  const { ensureRightPanelOpen } = useChatbotContext();

  useEffect(() => {
    ensureRightPanelOpen();
  }, [ensureRightPanelOpen]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="chatbot-right-rail"
    >
      <ChatbotDocumentsRightPanel />
    </div>
  );
}
