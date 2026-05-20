"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotSupplierOrdersPanel from "@/features/chatbot/components/ChatbotSupplierOrdersPanel";

/** Rail gauche page Chatbot — commandes fournisseur et bons matériel (remplace l’historique). */
export default function ChatbotOrdersLeftRail() {
  const { ensureRightPanelOpen, refreshRegistry } = useChatbotContext();

  useEffect(() => {
    ensureRightPanelOpen();
    void refreshRegistry();
  }, [ensureRightPanelOpen, refreshRegistry]);

  return (
    <div
      className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex min-h-0 flex-1 flex-col overflow-hidden p-0")}
      data-testid="chatbot-orders-left-rail"
    >
      <ChatbotSupplierOrdersPanel placement="leftRail" />
    </div>
  );
}
