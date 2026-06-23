import OpenAI from "openai";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import type { ChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import { resolveChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import {
  normalizeStoredMessages,
  type ChatbotStoredMessage,
} from "@/features/chatbot/chatbot-stored-messages";
import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
import {
  CHATBOT_OPENAI_MAX_ROUNDS,
  chatbotStoredToOpenAIMessages,
} from "@/features/chatbot/chatbot-openai-messages";
import { injectForcedLecotSearch } from "@/features/chatbot/chatbot-openai-forced-lecot";
import { applyHubAgentLecotOrderArgs } from "@/features/chatbot/chatbot-openai-hub-order";
import { streamChatbotOpenAIRound } from "@/features/chatbot/chatbot-openai-stream";
import {
  executeChatbotToolRound,
  prepareChatbotToolCalls,
} from "@/features/chatbot/chatbot-openai-execute-tools";
import type { OpenAIRunResult } from "@/features/chatbot/chatbot-openai-types";

export type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
export { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
export type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
export type { OpenAIRunResult } from "@/features/chatbot/chatbot-openai-types";
export { normalizeLecotOrderToolArguments } from "@/features/chatbot/chatbot-openai-lecot-args";

const MAX_ROUNDS = CHATBOT_OPENAI_MAX_ROUNDS;

export async function runChatbotOpenAI(params: {
  apiKey: string;
  modelName: string;
  system: string;
  messages: unknown[];
  toolCtx: ChatbotToolContext;
  toolScope?: string[];
  conversationContext?: ChatbotConversationContext;
  hasWorkspaceSnapshot?: boolean;
  hubAgentMode?: boolean;
  skipLecotChainGuard?: boolean;
  temperature?: number;
  emit: ChatbotStreamEmit;
}): Promise<OpenAIRunResult> {
  const stored = trimChatbotMessagesForApi(normalizeStoredMessages(params.messages));
  if (stored.length === 0) {
    throw new Error("Historique vide");
  }

  const ctx =
    params.conversationContext ??
    resolveChatbotConversationContext({
      messages: params.messages,
      hasWorkspaceSnapshot: Boolean(params.hasWorkspaceSnapshot),
      explicitToolScope: params.toolScope,
    });

  const lastUserText = ctx.lastUserText || null;
  const effectiveToolScope = params.toolScope ?? ctx.toolScope;

  const client = new OpenAI({ apiKey: params.apiKey });
  let apiMessages = [...stored];
  let openaiMessages = [
    { role: "system" as const, content: params.system },
    ...chatbotStoredToOpenAIMessages(stored),
  ];

  const injected = await injectForcedLecotSearch({
    ctx,
    hubAgentMode: params.hubAgentMode,
    apiMessages,
    openaiMessages,
    toolCtx: params.toolCtx,
    apiKey: params.apiKey,
    modelName: params.modelName,
    emit: params.emit,
  });
  apiMessages = injected.apiMessages;
  openaiMessages = injected.openaiMessages;

  let searchedLecotInHub = false;

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const { textAcc, parsedCalls } = await streamChatbotOpenAIRound({
      client,
      modelName: params.modelName,
      openaiMessages,
      effectiveToolScope,
      hubAgentMode: params.hubAgentMode,
      searchedLecotInHub,
      round,
      temperature: params.temperature ?? 0.25,
      emit: params.emit,
    });

    if (parsedCalls.length === 0) {
      if (textAcc.trim()) {
        apiMessages = [...apiMessages, { role: "assistant", content: textAcc.trim() }];
      }
      return { status: "done", apiMessages };
    }

    const hubEarly = applyHubAgentLecotOrderArgs({
      parsedCalls,
      hubAgentMode: params.hubAgentMode,
      toolCtx: params.toolCtx,
      apiMessages,
      emit: params.emit,
    });
    if (hubEarly) return hubEarly;

    const pending = prepareChatbotToolCalls({
      parsedCalls,
      lastUserText,
      hubAgentMode: params.hubAgentMode,
      apiMessages,
    });
    if (pending) return pending;

    const roundResult = await executeChatbotToolRound({
      parsedCalls,
      textAcc,
      apiMessages,
      openaiMessages,
      toolCtx: params.toolCtx,
      lastUserText,
      apiKey: params.apiKey,
      modelName: params.modelName,
      hubAgentMode: params.hubAgentMode,
      skipLecotChainGuard: params.skipLecotChainGuard,
      searchedLecotInHub,
      emit: params.emit,
    });

    if (roundResult.kind === "done") {
      return roundResult.result;
    }

    apiMessages = roundResult.apiMessages;
    searchedLecotInHub = roundResult.searchedLecotInHub;
  }

  return { status: "done", apiMessages };
}
