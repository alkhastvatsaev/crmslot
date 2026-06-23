import type { WorkspaceCopilotSnapshot } from "@/features/copilot";

/** Normalise le texte utilisateur (emoji, espaces) avant détection d'intent local. */
export function normalizeChatbotUserText(text: string): string {
  return text
    .trim()
    .replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const GREETING_RE =
  /^(hey|hi|hello|bonjour|bonsoir|salut|coucou|yo|allo|allô|bjr|bsr|slt|cc|hé|hep|dispo|présent|la|là|ca va|ça va|merci|ok)[\s!?.]*$/i;

export function isChatbotGreetingMessage(text: string): boolean {
  const t = normalizeChatbotUserText(text).toLowerCase();
  if (!t) return false;
  return GREETING_RE.test(t);
}

export function buildChatbotGreetingReply(snapshot?: WorkspaceCopilotSnapshot | null): string {
  const hint = snapshot
    ? ` ${snapshot.summary.urgentOpen > 0 ? `${snapshot.summary.urgentOpen} urgence(s) en attente. ` : ""}${snapshot.summary.awaitingAssignment > 0 ? `${snapshot.summary.awaitingAssignment} dossier(s) à assigner.` : ""}`
    : "";
  return `Bonjour ! Comment puis-je vous aider ?${hint.trim() ? ` (${hint.trim()})` : ""}`;
}
