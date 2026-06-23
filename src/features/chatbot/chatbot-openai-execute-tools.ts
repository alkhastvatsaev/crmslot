import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { logger } from "@/core/logger";
import { shouldAutoConfirmChatbotBillingWrite } from "@/features/chatbot/chatbot-billing-parse";
import { normalizeSendInterventionEmailArguments } from "@/features/chatbot/chatbot-email-attach";
import { shouldAutoConfirmChatbotEmailWrite } from "@/features/chatbot/chatbot-email-intent";
import { buildChatbotPostToolReply } from "@/features/chatbot/chatbot-post-tool-reply";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";
import { buildLecotProductQuickActions } from "@/features/chatbot/chatbot-quick-actions";
import {
  extractDocumentPreviewFromResult,
  isChatbotZeroTokenUiTool,
  MINIMAL_DOCUMENT_TOOL_RESULT_JSON,
  documentToolSuccessMessage,
} from "@/features/chatbot/chatbot-document-side-effect";
import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";
import {
  emitHubAgentToolSideEffects,
  hubUiToolSuccessMessage,
} from "@/features/hubAgents/hubAgentSideEffects";
import { HUB_AGENT_IMMEDIATE_UI_TOOLS } from "@/features/hubAgents/hubAgentToolScopes";
import { isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import {
  executeChatbotTool,
  type ChatbotToolContext,
} from "@/features/chatbot/chatbot-tool-executor";
import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
import { CHATBOT_TOOL_LABELS } from "@/features/chatbot/chatbot-tool-labels";
import { chatbotPendingToolSummary } from "@/features/chatbot/chatbot-openai-pending";
import { normalizeLecotOrderToolArguments } from "@/features/chatbot/chatbot-openai-lecot-args";
import type { OpenAIRunResult } from "@/features/chatbot/chatbot-openai-types";
import type { ChatbotParsedToolCall } from "@/features/chatbot/chatbot-openai-stream";

export function prepareChatbotToolCalls(params: {
  parsedCalls: ChatbotParsedToolCall[];
  lastUserText: string | null;
  hubAgentMode?: boolean;
  apiMessages: ChatbotStoredMessage[];
}): OpenAIRunResult | null {
  for (const call of params.parsedCalls) {
    const isWrite = isChatbotWriteTool(call.name);
    let confirmed = call.arguments.userConfirmed === true;
    if (
      isWrite &&
      !confirmed &&
      (params.hubAgentMode ||
        shouldAutoConfirmChatbotBillingWrite(call.name, params.lastUserText) ||
        shouldAutoConfirmChatbotEmailWrite(call.name, params.lastUserText))
    ) {
      call.arguments.userConfirmed = true;
      confirmed = true;
    }

    if (isWrite && !confirmed && call.name !== "order_lecot_parts") {
      return {
        status: "pending",
        apiMessages: params.apiMessages,
        pending: {
          toolUseId: call.id,
          name: call.name,
          input: call.arguments,
          summary: chatbotPendingToolSummary(call.name, call.arguments),
        },
      };
    }

    if (call.name === "order_lecot_parts") {
      call.arguments.userConfirmed = true;
      normalizeLecotOrderToolArguments(call.arguments);
    }
    if (call.name === "send_intervention_email") {
      normalizeSendInterventionEmailArguments(call.arguments, params.lastUserText);
    }
  }
  return null;
}

export async function executeChatbotToolRound(params: {
  parsedCalls: ChatbotParsedToolCall[];
  textAcc: string;
  apiMessages: ChatbotStoredMessage[];
  openaiMessages: ChatCompletionMessageParam[];
  toolCtx: ChatbotToolContext;
  lastUserText: string | null;
  apiKey: string;
  modelName: string;
  hubAgentMode?: boolean;
  skipLecotChainGuard?: boolean;
  searchedLecotInHub: boolean;
  emit: ChatbotStreamEmit;
}): Promise<
  | { kind: "done"; result: OpenAIRunResult }
  | { kind: "continue"; apiMessages: ChatbotStoredMessage[]; searchedLecotInHub: boolean }
> {
  let { apiMessages, searchedLecotInHub } = params;
  const { openaiMessages } = params;
  const { parsedCalls, textAcc } = params;

  const assistantTurn: ChatbotStoredMessage = {
    role: "assistant",
    content: textAcc.trim() || null,
    tool_calls: parsedCalls.map((c) => ({
      id: c.id,
      name: c.name,
      arguments: c.arguments,
    })),
  };
  apiMessages = [...apiMessages, assistantTurn];
  openaiMessages.push({
    role: "assistant",
    content: textAcc.trim() || null,
    tool_calls: parsedCalls.map((c) => ({
      id: c.id,
      type: "function",
      function: { name: c.name, arguments: JSON.stringify(c.arguments) },
    })),
  });

  for (const call of parsedCalls) {
    params.emit({
      type: "tool_start",
      tool: call.name,
      label: CHATBOT_TOOL_LABELS[call.name] ?? call.name,
    });
  }

  const executed = await Promise.all(
    parsedCalls.map(async (call) => {
      try {
        const result = await executeChatbotTool(call.name, call.arguments, {
          ...params.toolCtx,
          lastUserText: params.toolCtx.lastUserText ?? params.lastUserText,
          openAIApiKey: params.apiKey,
          openAIModelName: params.modelName,
        });
        return { call, result };
      } catch (err) {
        logger.error(`[chatbot tool] ${call.name} failed:`, {
          error: err instanceof Error ? err.message : String(err),
        });
        return {
          call,
          result: { error: err instanceof Error ? err.message : "Erreur outil" },
        };
      }
    })
  );

  const toolResultMessages: ChatbotStoredMessage[] = [];

  for (const { call, result } of executed) {
    params.emit({ type: "tool_end", tool: call.name });

    emitHubAgentToolSideEffects(call.name, result, params.emit, params.toolCtx.companyId);

    const preview = extractDocumentPreviewFromResult(result);
    if (preview) {
      params.emit({ type: "document_preview", ...preview });
    }

    if (HUB_AGENT_IMMEDIATE_UI_TOOLS.has(call.name)) {
      const successMsg = hubUiToolSuccessMessage(call.name, result);
      params.emit({ type: "text", delta: successMsg });
      const content = MINIMAL_DOCUMENT_TOOL_RESULT_JSON;
      toolResultMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });
      openaiMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });
      return {
        kind: "done",
        result: {
          status: "done",
          apiMessages: [
            ...apiMessages,
            ...toolResultMessages,
            { role: "assistant", content: successMsg },
          ],
        },
      };
    }

    if (call.name === "order_lecot_parts") {
      emitChatbotOrderRegisteredEvents(params.emit, params.toolCtx.companyId, result);
      if (params.hubAgentMode) {
        const clientName = String(call.arguments.clientName ?? "").trim();
        if (clientName) {
          params.emit({ type: "material_order_client", clientName });
        }
      }
      if (result && typeof result === "object" && !("error" in result)) {
        const orderText = documentToolSuccessMessage("order_lecot_parts", result);
        params.emit({ type: "text", delta: orderText });
        return {
          kind: "done",
          result: {
            status: "done",
            apiMessages: [
              ...apiMessages,
              ...toolResultMessages,
              { role: "assistant", content: orderText },
            ],
          },
        };
      }
    }

    if (call.name === "search_lecot_products" && result && typeof result === "object") {
      const suggestions = (result as { suggestions?: unknown }).suggestions;
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        const actions = buildLecotProductQuickActions(
          suggestions as Parameters<typeof buildLecotProductQuickActions>[0]
        );
        if (actions.length > 0) {
          params.emit({ type: "quick_actions", actions });
          if (params.hubAgentMode && !params.skipLecotChainGuard) searchedLecotInHub = true;
        }
      }
    }

    const content = isChatbotZeroTokenUiTool(call.name)
      ? MINIMAL_DOCUMENT_TOOL_RESULT_JSON
      : stringifyChatbotToolResult(call.name, result);
    toolResultMessages.push({
      role: "tool",
      tool_call_id: call.id,
      content,
    });
    openaiMessages.push({
      role: "tool",
      tool_call_id: call.id,
      content,
    });

    if (isChatbotZeroTokenUiTool(call.name)) {
      const successMsg = documentToolSuccessMessage(call.name, result);
      params.emit({ type: "text", delta: successMsg });
      return {
        kind: "done",
        result: {
          status: "done",
          apiMessages: [
            ...apiMessages,
            ...toolResultMessages,
            { role: "assistant", content: successMsg },
          ],
        },
      };
    }

    if (
      call.name === "send_intervention_email" ||
      call.name === "save_client_email" ||
      call.name === "send_gmail_reply" ||
      call.name === "link_gmail_to_intervention"
    ) {
      const successMsg = buildChatbotPostToolReply(call.name, result);
      params.emit({ type: "text", delta: successMsg });
      return {
        kind: "done",
        result: {
          status: "done",
          apiMessages: [
            ...apiMessages,
            ...toolResultMessages,
            { role: "assistant", content: successMsg },
          ],
        },
      };
    }
  }

  return {
    kind: "continue",
    apiMessages: [...apiMessages, ...toolResultMessages],
    searchedLecotInHub,
  };
}
