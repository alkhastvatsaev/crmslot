import type { ChatbotConversation } from "@/features/chatbot/chatbot-types";

export const CHATBOT_CONVERSATION_STORAGE_PREFIX = "crmslot-chatbot-v2";

export function loadChatbotConversations(key: string): ChatbotConversation[] {
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

export function saveChatbotConversations(key: string, rows: ChatbotConversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 30)));
  } catch {
    /* quota */
  }
}
