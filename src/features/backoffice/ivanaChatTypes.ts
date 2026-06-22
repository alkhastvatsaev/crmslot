export type IvanaChatMessage = {
  id: string;
  role: "user" | "ivana" | "client" | "staff";
  text: string;
  images?: string[];
  createdAt: number;
  senderName?: string;
  senderUid?: string;
  pending?: boolean;
  failed?: boolean;
};

export const IVANA_CHAT_STORAGE_PREFIX = "map-belgique-ivana-chat-v1";
export const IVANA_CHAT_PERSISTENCE_ENABLED = false;

export function pickIvanaReply(userText: string, t: (key: string) => string): string {
  const lower = userText.toLowerCase();
  if (/\burgent|urgence|immédiat|rapide\b/.test(lower)) return t("chat.reply_urgent");
  if (/\bfacture|facturation|paiement|devis\b/.test(lower)) return t("chat.reply_billing");
  if (/\brdv|rendez-vous|créneau|horaire|planif\b/.test(lower)) return t("chat.reply_schedule");
  if (/\bmerci|thanks\b/.test(lower)) return t("chat.reply_thanks");
  return t("chat.reply_default");
}

export function ivanaWelcomeMessage(t: (key: string) => string): IvanaChatMessage {
  return {
    id: "welcome",
    role: "ivana",
    text: t("chat.welcome"),
    createdAt: Date.now(),
  };
}

export function ivanaBubbleTestId(m: IvanaChatMessage): string {
  if (m.role === "user") return "ivana-chat-bubble-user";
  if (m.role === "client") return "ivana-chat-bubble-client";
  if (m.role === "staff") return "ivana-chat-bubble-staff";
  return "ivana-chat-bubble-ivana";
}

export function ivanaBubbleAlign(m: IvanaChatMessage): string {
  return m.role === "user" || m.role === "client" ? "justify-end" : "justify-start";
}

export function ivanaSenderHeader(m: IvanaChatMessage, t: (key: string) => string): string | null {
  if (m.role === "client") return m.senderName?.trim() || t("chat.role_client");
  if (m.role === "staff") return m.senderName?.trim() || t("chat.role_staff");
  return null;
}
