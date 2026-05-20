import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";

export type ChatbotTrainingTurnExtract = {
  userMessage: string;
  assistantMessage: string;
  hadToolRounds: boolean;
};

function lastUserMessageIndex(msgs: ChatbotStoredMessage[]): number {
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    if (msgs[i].role === "user" && typeof msgs[i].content === "string" && (msgs[i].content as string).trim()) {
      return i;
    }
  }
  return -1;
}

/** Dernier tour avec texte assistant (ignore les tours uniquement outils sans texte final). */
function lastAssistantTextIndex(msgs: ChatbotStoredMessage[]): number {
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    const m = msgs[i];
    if (m.role !== "assistant") continue;
    const c = m.content;
    if (typeof c === "string" && c.trim()) return i;
  }
  return -1;
}

/**
 * Extrait la dernière paire question / réponse textuelle depuis l’historique API après un tour chatbot.
 */
export function extractChatbotTrainingTurn(apiMessages: unknown[]): ChatbotTrainingTurnExtract | null {
  const msgs = normalizeStoredMessages(apiMessages);
  const iu = lastUserMessageIndex(msgs);
  const ia = lastAssistantTextIndex(msgs);
  if (iu < 0 || ia < 0 || ia < iu) return null;

  const userMessage = String(msgs[iu].role === "user" ? msgs[iu].content : "").trim();
  const assistantMessage = String(
    msgs[ia].role === "assistant" ? msgs[ia].content ?? "" : "",
  ).trim();
  if (!userMessage || !assistantMessage) return null;

  let hadToolRounds = false;
  for (let j = iu + 1; j < ia; j += 1) {
    if (msgs[j].role === "tool") {
      hadToolRounds = true;
      break;
    }
  }

  return { userMessage, assistantMessage, hadToolRounds };
}
