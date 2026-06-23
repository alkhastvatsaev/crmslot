import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { buildLecotProductQuickActions } from "@/features/chatbot/chatbot-quick-actions";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";
import type { ChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import {
  executeChatbotTool,
  type ChatbotToolContext,
} from "@/features/chatbot/chatbot-tool-executor";
import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
import { CHATBOT_TOOL_LABELS } from "@/features/chatbot/chatbot-tool-labels";

export async function injectForcedLecotSearch(params: {
  ctx: ChatbotConversationContext;
  hubAgentMode?: boolean;
  apiMessages: ChatbotStoredMessage[];
  openaiMessages: ChatCompletionMessageParam[];
  toolCtx: ChatbotToolContext;
  apiKey: string;
  modelName: string;
  emit: ChatbotStreamEmit;
}): Promise<{
  apiMessages: ChatbotStoredMessage[];
  openaiMessages: ChatCompletionMessageParam[];
}> {
  const { ctx, hubAgentMode, toolCtx, apiKey, modelName, emit } = params;
  let { apiMessages, openaiMessages } = params;

  if (ctx.forceToolName !== "search_lecot_products" || !ctx.lecotSearchQuery || hubAgentMode) {
    return { apiMessages, openaiMessages };
  }

  const preCallId = `force_lecot_${Date.now()}`;
  const preArgs = { query: ctx.lecotSearchQuery, limit: 5 };
  emit({
    type: "tool_start",
    tool: "search_lecot_products",
    label: CHATBOT_TOOL_LABELS["search_lecot_products"] ?? "Recherche Lecot",
  });
  const preResult = await executeChatbotTool("search_lecot_products", preArgs, {
    ...toolCtx,
    openAIApiKey: apiKey,
    openAIModelName: modelName,
  }).catch((err: unknown) => ({ error: err instanceof Error ? err.message : "Erreur outil" }));
  emit({ type: "tool_end", tool: "search_lecot_products" });
  if (preResult && typeof preResult === "object") {
    const suggestions = (preResult as { suggestions?: unknown }).suggestions;
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      const actions = buildLecotProductQuickActions(
        suggestions as Parameters<typeof buildLecotProductQuickActions>[0]
      );
      if (actions.length > 0) emit({ type: "quick_actions", actions });
    }
  }
  const preContent = stringifyChatbotToolResult("search_lecot_products", preResult);
  const preTurn: ChatbotStoredMessage = {
    role: "assistant",
    content: null,
    tool_calls: [{ id: preCallId, name: "search_lecot_products", arguments: preArgs }],
  };
  apiMessages = [
    ...apiMessages,
    preTurn,
    { role: "tool", tool_call_id: preCallId, content: preContent },
  ];
  openaiMessages = [
    ...openaiMessages,
    {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: preCallId,
          type: "function",
          function: { name: "search_lecot_products", arguments: JSON.stringify(preArgs) },
        },
      ],
    },
    { role: "tool", tool_call_id: preCallId, content: preContent },
  ];

  return { apiMessages, openaiMessages };
}
