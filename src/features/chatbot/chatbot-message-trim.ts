import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";

const MAX_MESSAGES = 14;
const MAX_TOOL_CONTENT_CHARS = 2_000;

/**
 * Supprime les `tool` orphelins et les `assistant` avec `tool_calls` sans réponses complètes
 * (évite l'erreur OpenAI 400 sur l'historique).
 */
export function repairChatbotToolMessagePairs(messages: ChatbotStoredMessage[]): ChatbotStoredMessage[] {
  const out: ChatbotStoredMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const m = messages[i];

    if (m.role === "tool") {
      i += 1;
      continue;
    }

    if (m.role !== "assistant" || !m.tool_calls?.length) {
      out.push(m);
      i += 1;
      continue;
    }

    const ids = m.tool_calls.map((tc) => tc.id);
    const toolsById = new Map<string, ChatbotStoredMessage>();
    let j = i + 1;
    while (j < messages.length && messages[j].role === "tool") {
      const t = messages[j];
      if (t.role === "tool" && ids.includes(t.tool_call_id) && !toolsById.has(t.tool_call_id)) {
        toolsById.set(t.tool_call_id, t);
      }
      j += 1;
    }

    if (ids.every((id) => toolsById.has(id))) {
      out.push(m);
      for (const id of ids) {
        out.push(toolsById.get(id)!);
      }
      i = j;
      continue;
    }

    if (m.content?.trim()) {
      out.push({ role: "assistant", content: m.content });
    }
    i = j;
  }

  return out;
}

/** Insère tool + réponse assistant après le tour `tool_calls` correspondant. */
export function appendChatbotToolRoundResult(
  messages: ChatbotStoredMessage[],
  toolCallId: string,
  toolName: string,
  toolResultJson: string,
  assistantText: string,
): ChatbotStoredMessage[] {
  const stored = repairChatbotToolMessagePairs(trimChatbotMessagesForApi(messages));

  const toolMsg: ChatbotStoredMessage = {
    role: "tool",
    tool_call_id: toolCallId,
    content: toolResultJson,
  };
  const reply: ChatbotStoredMessage = { role: "assistant", content: assistantText };

  for (let i = stored.length - 1; i >= 0; i--) {
    const m = stored[i];
    if (m.role !== "assistant" || !m.tool_calls?.some((tc) => tc.id === toolCallId)) continue;

    const hasTool = stored
      .slice(i + 1)
      .some((x) => x.role === "tool" && x.tool_call_id === toolCallId);
    if (hasTool) {
      return repairChatbotToolMessagePairs([...stored, reply]);
    }

    return repairChatbotToolMessagePairs([
      ...stored.slice(0, i + 1),
      toolMsg,
      reply,
      ...stored.slice(i + 1).filter((x) => x.role !== "tool" || x.tool_call_id !== toolCallId),
    ]);
  }

  const shell: ChatbotStoredMessage = {
    role: "assistant",
    content: null,
    tool_calls: [{ id: toolCallId, name: toolName, arguments: {} }],
  };
  return repairChatbotToolMessagePairs([...stored, shell, toolMsg, reply]);
}

function shrinkToolContent(content: string): string {
  if (content.length <= MAX_TOOL_CONTENT_CHARS) return content;
  return `${content.slice(0, MAX_TOOL_CONTENT_CHARS - 24)}…","_trimmed":true}`;
}

/** Garde les derniers tours ; compresse les vieux résultats d'outils. */
export function trimChatbotMessagesForApi(messages: ChatbotStoredMessage[]): ChatbotStoredMessage[] {
  if (messages.length <= MAX_MESSAGES) {
    return repairChatbotToolMessagePairs(
      messages.map((m, i) => {
        if (m.role !== "tool" || i >= messages.length - 4) return m;
        return { ...m, content: shrinkToolContent(m.content) };
      }),
    );
  }

  // Collecter les messages depuis la fin, en gardant les groupes intacts
  const tail: ChatbotStoredMessage[] = [];
  let i = messages.length - 1;
  while (i >= 0 && tail.length < MAX_MESSAGES) {
    const m = messages[i];
    if (m.role === "tool") {
      // Trouver tous les messages tool contigus et le message assistant parent
      const group: ChatbotStoredMessage[] = [];
      while (i >= 0 && messages[i].role === "tool") {
        group.unshift(messages[i]);
        i--;
      }
      const prevMsg = messages[i];
      if (i >= 0 && prevMsg.role === "assistant" && prevMsg.tool_calls) {
        group.unshift(prevMsg);
        i--;
      } else if (group.length > 0) {
        // tools orphelins (assistant parent retiré par le trim) — ignorer
        group.length = 0;
      }
      if (group.length > 0) {
        tail.unshift(...group);
      }
    } else {
      tail.unshift(m);
      i--;
    }
  }

  // Toujours garder le message système s'il y en avait un au début (si applicable, bien que le context building s'en charge généralement)
  // Compress older tools
  return repairChatbotToolMessagePairs(
    tail.map((m, idx) => {
      if (m.role !== "tool" || idx >= tail.length - 3) return m;
      return { ...m, content: shrinkToolContent(m.content) };
    }),
  );
}

/** Re-compacte un message tool déjà stocké (migration douce). */
export function recompactStoredToolMessage(
  toolName: string,
  content: string,
): string {
  try {
    const parsed = JSON.parse(content) as unknown;
    return stringifyChatbotToolResult(toolName, parsed);
  } catch {
    return shrinkToolContent(content);
  }
}
