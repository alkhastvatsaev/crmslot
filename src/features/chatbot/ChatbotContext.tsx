"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";

export type ChatbotContextValue = ReturnType<typeof useChatbot>;

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

/** Partage l'état Chatbot entre le chat (page 5) et le Galaxy dock. */
export function ChatbotProvider({ children }: { children: ReactNode }) {
  const value = useChatbot();
  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
}

export function useChatbotContext(): ChatbotContextValue {
  const ctx = useContext(ChatbotContext);
  if (!ctx) {
    throw new Error("useChatbotContext doit être utilisé sous ChatbotProvider.");
  }
  return ctx;
}

export function useChatbotContextOptional(): ChatbotContextValue | null {
  return useContext(ChatbotContext);
}
