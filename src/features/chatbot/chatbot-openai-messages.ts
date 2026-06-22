import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { CHATBOT_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools";
import { filterChatbotToolDefinitions } from "@/features/chatbot/chatbot-tool-routing";
import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";

export const CHATBOT_OPENAI_MAX_ROUNDS = 5;

export type ChatbotOpenAIToolCallAccum = { id: string; name: string; arguments: string };

export function chatbotOpenaiTools(toolScope?: string[]): ChatCompletionTool[] {
  const defs = filterChatbotToolDefinitions(CHATBOT_TOOL_DEFINITIONS, toolScope);
  return defs.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

export function chatbotStoredToOpenAIMessages(
  stored: ChatbotStoredMessage[]
): ChatCompletionMessageParam[] {
  return stored.map((m) => {
    if (m.role === "user") {
      return { role: "user", content: m.content };
    }
    if (m.role === "tool") {
      return { role: "tool", tool_call_id: m.tool_call_id, content: m.content };
    }
    if (m.tool_calls?.length) {
      return {
        role: "assistant",
        content: m.content ?? null,
        tool_calls: m.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      };
    }
    return { role: "assistant", content: m.content ?? "" };
  });
}
