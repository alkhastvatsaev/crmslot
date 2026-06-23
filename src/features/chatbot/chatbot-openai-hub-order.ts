import {
  materialAgentAskClientNameAssistantContent,
  isMaterialAgentLecotCommandText,
} from "@/features/featureHub/materialAgentOrderClient";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
import type { OpenAIRunResult } from "@/features/chatbot/chatbot-openai-types";
import type { ChatbotParsedToolCall } from "@/features/chatbot/chatbot-openai-stream";

export function applyHubAgentLecotOrderArgs(params: {
  parsedCalls: ChatbotParsedToolCall[];
  hubAgentMode?: boolean;
  toolCtx: ChatbotToolContext;
  apiMessages: ChatbotStoredMessage[];
  emit: (event: { type: "text"; delta: string }) => void;
}): OpenAIRunResult | null {
  if (!params.hubAgentMode) return null;

  const orderCall = params.parsedCalls.find((c) => c.name === "order_lecot_parts");
  if (!orderCall) return null;

  const rawFromAI = String(orderCall.arguments.clientName ?? "").trim();
  const aiNameValid =
    rawFromAI && !isMaterialAgentLecotCommandText(rawFromAI) && rawFromAI.length <= 80;

  if (params.toolCtx.requireMaterialOrderClientName) {
    const effectiveClient = aiNameValid
      ? rawFromAI
      : params.toolCtx.materialOrderClientName?.trim() || "";
    if (!effectiveClient) {
      const ask = materialAgentAskClientNameAssistantContent();
      params.emit({ type: "text", delta: ask });
      return {
        status: "done",
        apiMessages: [...params.apiMessages, { role: "assistant", content: ask }],
      };
    }
    orderCall.arguments.clientName = effectiveClient;
  } else if (!aiNameValid && params.toolCtx.materialOrderClientName?.trim()) {
    orderCall.arguments.clientName = params.toolCtx.materialOrderClientName.trim();
  }

  const focusIv = params.toolCtx.materialOrderInterventionId?.trim();
  if (focusIv && !String(orderCall.arguments.interventionId ?? "").trim()) {
    orderCall.arguments.interventionId = focusIv;
  }

  return null;
}
