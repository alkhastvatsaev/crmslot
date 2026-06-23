import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import OpenAI from "openai";
import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
import {
  type ChatbotOpenAIToolCallAccum,
  chatbotOpenaiTools,
} from "@/features/chatbot/chatbot-openai-messages";

export type ChatbotParsedToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export async function streamChatbotOpenAIRound(params: {
  client: OpenAI;
  modelName: string;
  openaiMessages: ChatCompletionMessageParam[];
  effectiveToolScope: string[] | undefined;
  hubAgentMode?: boolean;
  searchedLecotInHub: boolean;
  round: number;
  temperature: number;
  emit: ChatbotStreamEmit;
}): Promise<{ textAcc: string; parsedCalls: ChatbotParsedToolCall[] }> {
  const scopeForRound =
    params.hubAgentMode && params.searchedLecotInHub
      ? (params.effectiveToolScope ?? []).filter((t) => t !== "order_lecot_parts")
      : params.effectiveToolScope;
  const resolvedTools = chatbotOpenaiTools(scopeForRound);
  const maxTokens = params.round === 0 ? 640 : 480;

  const stream = await params.client.chat.completions.create({
    model: params.modelName,
    messages: params.openaiMessages,
    ...(resolvedTools.length > 0 ? { tools: resolvedTools, tool_choice: "auto" as const } : {}),
    temperature: params.temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  let textAcc = "";
  const toolAcc: Record<number, ChatbotOpenAIToolCallAccum> = {};

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    const delta = choice?.delta;
    if (delta?.content) {
      textAcc += delta.content;
      params.emit({ type: "text", delta: delta.content });
    }
    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolAcc[idx]) {
          toolAcc[idx] = {
            id: tc.id?.trim() || `call_${idx}_${params.round}`,
            name: "",
            arguments: "",
          };
        }
        if (tc.id?.trim()) toolAcc[idx].id = tc.id.trim();
        if (tc.function?.name) toolAcc[idx].name = tc.function.name;
        if (tc.function?.arguments) toolAcc[idx].arguments += tc.function.arguments;
      }
    }
  }

  const parsedCalls = Object.values(toolAcc)
    .filter((t) => t.name)
    .map((tc) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      return { id: tc.id, name: tc.name, arguments: args };
    });

  return { textAcc, parsedCalls };
}
