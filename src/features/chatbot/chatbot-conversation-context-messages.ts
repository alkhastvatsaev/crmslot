import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-conversation-context-types";

export function normalizeChatbotMessages(messages: unknown[]): ChatbotStoredMessage[] {
  if (!Array.isArray(messages)) return [];
  const out: ChatbotStoredMessage[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const m = raw as ChatbotStoredMessage;
    if (m.role !== "user" && m.role !== "assistant" && m.role !== "tool") continue;
    out.push(m);
  }
  return out;
}

export function recentDialogText(messages: unknown[], maxTurns = 8): string {
  const stored = normalizeChatbotMessages(messages);
  return stored
    .slice(-maxTurns)
    .map((m) => {
      if (m.role === "user" || (m.role === "assistant" && m.content)) {
        return String(m.content ?? "").trim();
      }
      if (m.role === "assistant" && m.tool_calls?.length) {
        return m.tool_calls.map((tc) => tc.name).join(" ");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function lastAssistantText(messages: unknown[]): string {
  const stored = normalizeChatbotMessages(messages);
  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role === "assistant" && m.content?.trim()) return m.content.trim();
  }
  return "";
}

export function isShortFollowUpAnswer(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 72) return false;
  return t.split(/\s+/).length <= 10;
}

export function lastUserTextFromMessages(messages: unknown[]): string {
  const stored = normalizeChatbotMessages(messages);
  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role === "user" && m.content?.trim()) return m.content.trim();
  }
  return "";
}
