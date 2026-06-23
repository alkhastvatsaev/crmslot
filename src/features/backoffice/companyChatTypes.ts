export type CompanyChatMessage = {
  id: string;
  role: "user" | "assistant" | "client" | "staff";
  text: string;
  images?: string[];
  createdAt: number;
  senderName?: string;
  senderUid?: string;
  pending?: boolean;
  failed?: boolean;
};

export const COMPANY_CHAT_STORAGE_PREFIX = "map-belgique-company-chat-v1";
export const COMPANY_CHAT_PERSISTENCE_ENABLED = false;

export function pickLocalChatReply(userText: string, t: (key: string) => string): string {
  const lower = userText.toLowerCase();
  if (/\burgent|urgence|immédiat|rapide\b/.test(lower)) return t("chat.reply_urgent");
  if (/\bfacture|facturation|paiement|devis\b/.test(lower)) return t("chat.reply_billing");
  if (/\brdv|rendez-vous|créneau|horaire|planif\b/.test(lower)) return t("chat.reply_schedule");
  if (/\bmerci|thanks\b/.test(lower)) return t("chat.reply_thanks");
  return t("chat.reply_default");
}

export function companyChatWelcomeMessage(t: (key: string) => string): CompanyChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: t("chat.welcome"),
    createdAt: Date.now(),
  };
}

export function companyChatBubbleTestId(m: CompanyChatMessage): string {
  if (m.role === "user") return "company-chat-bubble-user";
  if (m.role === "client") return "company-chat-bubble-client";
  if (m.role === "staff") return "company-chat-bubble-staff";
  return "company-chat-bubble-assistant";
}

export function companyChatBubbleAlign(m: CompanyChatMessage): string {
  return m.role === "user" || m.role === "client" ? "justify-end" : "justify-start";
}

export function companyChatSenderHeader(
  m: CompanyChatMessage,
  t: (key: string) => string
): string | null {
  if (m.role === "client") return m.senderName?.trim() || t("chat.role_client");
  if (m.role === "staff") return m.senderName?.trim() || t("chat.role_staff");
  return null;
}
