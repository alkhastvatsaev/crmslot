"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import ChatbotSupplierOrdersPanel from "@/features/chatbot/components/ChatbotSupplierOrdersPanel";

/** Rail droit page Matériel — même panneau Commandes que le rail gauche Chatbot. */
export default function CompanyStockOrdersRightRail() {
  const { ensureRightPanelOpen, refreshRegistry } = useChatbotContext();

  useEffect(() => {
    ensureRightPanelOpen();
    void refreshRegistry();
  }, [ensureRightPanelOpen, refreshRegistry]);

  return (
    <div
      className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex min-h-0 flex-1 flex-col overflow-hidden p-0")}
      data-testid="company-stock-orders-right-rail"
    >
      <ChatbotSupplierOrdersPanel placement="rightRail" />
    </div>
  );
}
