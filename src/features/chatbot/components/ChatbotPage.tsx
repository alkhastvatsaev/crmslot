"use client";

import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import ChatbotChat from "@/features/chatbot/components/ChatbotChat";
import ChatbotOrdersLeftRail from "@/features/chatbot/components/ChatbotOrdersLeftRail";
import ChatbotRightRail from "@/features/chatbot/components/ChatbotRightRail";
import { AI_ASSISTANT_SLOT_INDEX } from "@/features/ai/aiAssistantConstants";

type Props = { slotIndex?: number };

/** Page 5 carrousel — Chatbot (OpenAI + tools + snapshot PWA). */
export default function ChatbotPage({ slotIndex = AI_ASSISTANT_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;

  return (
    <DashboardTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`Page ${humanPage} — commandes Chatbot`}
      centerAriaLabel={`Page ${humanPage} — Chatbot`}
      rightAriaLabel={`Page ${humanPage} — bons de commande et factures`}
      centerPadding={false}
      rightPadding={false}
      left={<ChatbotOrdersLeftRail />}
      center={<ChatbotChat />}
      right={<ChatbotRightRail />}
    />
  );
}
