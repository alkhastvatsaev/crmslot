/** Format messages API chatbot — module sans dépendance executor/openai (évite cycle d'import). */

export type ChatbotStoredMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

/** Accepte le format OpenAI + ancien format Gemini côté client. */
export function normalizeStoredMessages(messages: unknown[]): ChatbotStoredMessage[] {
  const out: ChatbotStoredMessage[] = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const m = raw as Record<string, unknown>;

    if (m.role === "user" && typeof m.content === "string") {
      out.push({ role: "user", content: m.content });
      continue;
    }

    if (m.role === "tool" && typeof m.tool_call_id === "string") {
      out.push({
        role: "tool",
        tool_call_id: m.tool_call_id,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? {}),
      });
      continue;
    }

    if (m.role === "assistant" || m.role === "model") {
      const tool_calls = Array.isArray(m.tool_calls)
        ? (m.tool_calls as Array<{ id: string; name: string; arguments: Record<string, unknown> }>)
        : Array.isArray(m.functionCalls)
          ? (m.functionCalls as Array<{ name: string; args: Record<string, unknown> }>).map(
              (fc, i) => ({
                id: `call_${fc.name}_${i}`,
                name: fc.name,
                arguments: fc.args,
              }),
            )
          : undefined;
      out.push({
        role: "assistant",
        content: typeof m.content === "string" ? m.content : null,
        tool_calls,
      });
      continue;
    }

    if (m.role === "user" && Array.isArray(m.functionResponses)) {
      for (const fr of m.functionResponses as Array<{ name: string; response: unknown }>) {
        out.push({
          role: "tool",
          tool_call_id: String(fr.name),
          content: JSON.stringify(fr.response ?? {}),
        });
      }
    }
  }
  return out;
}
