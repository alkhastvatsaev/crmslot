import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import type { ChatbotStoredMessage } from "@/features/chatbot/chatbot-stored-messages";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { appendChatbotToolRoundResult } from "@/features/chatbot/chatbot-message-trim";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";
import {
  documentToolSuccessMessage,
  extractDocumentPreviewFromResult,
  MINIMAL_DOCUMENT_TOOL_RESULT_JSON,
} from "@/features/chatbot/chatbot-document-side-effect";
import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";

export function sseLine(obj: unknown): string {
  try {
    return `${JSON.stringify(obj)}\n`;
  } catch {
    return `${JSON.stringify({ type: "error", message: "Réponse chatbot trop volumineuse" })}\n`;
  }
}

/** Réponse texte immédiate (salutations, résumé local) — 0 appel OpenAI. */
export function streamChatbotInstantReply(params: {
  messages: unknown[];
  replyText: string;
}): Response {
  return createChatbotSseResponse(async (enqueue) => {
    const stored = normalizeStoredMessages(params.messages);
    const apiMessages: ChatbotStoredMessage[] = [
      ...stored,
      { role: "assistant", content: params.replyText },
    ];
    enqueue({ type: "text", delta: params.replyText });
    enqueue({ type: "done", apiMessages });
  });
}

export function createChatbotSseResponse(
  run: (enqueue: (ev: unknown) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (ev: unknown) => controller.enqueue(encoder.encode(sseLine(ev)));
      try {
        await run(enqueue);
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur Chatbot";
        console.error("[chatbot/sse]", error);
        enqueue({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export function buildApiMessagesAfterDocumentTool(
  messages: unknown[],
  toolCallId: string,
  toolName: string,
  assistantText: string,
): ChatbotStoredMessage[] {
  return appendChatbotToolRoundResult(
    normalizeStoredMessages(messages),
    toolCallId,
    toolName,
    MINIMAL_DOCUMENT_TOOL_RESULT_JSON,
    assistantText,
  );
}

export function buildApiMessagesAfterLecotOrder(
  messages: unknown[],
  toolCallId: string,
  toolName: string,
  toolResultJson: string,
  assistantText: string,
): ChatbotStoredMessage[] {
  return appendChatbotToolRoundResult(
    normalizeStoredMessages(messages),
    toolCallId,
    toolName,
    toolResultJson,
    assistantText,
  );
}

/** Confirmation commande Lecot : Firestore + panneau droit, sans 2e appel OpenAI. */
export function streamLecotOrderToolOutcome(params: {
  messages: unknown[];
  toolCallId: string;
  companyId: string;
  input: Record<string, unknown>;
  toolCtx: ChatbotToolContext;
}): Response {
  return createChatbotSseResponse(async (enqueue) => {
    enqueue({ type: "tool_start", tool: "order_lecot_parts", label: "Commande Lecot" });
    const result = await executeChatbotTool(
      "order_lecot_parts",
      { ...params.input, userConfirmed: true },
      params.toolCtx,
    ).catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "Erreur commande",
    }));
    enqueue({ type: "tool_end", tool: "order_lecot_parts" });

    if (result && typeof result === "object" && "error" in result) {
      enqueue({
        type: "error",
        message: String((result as { error?: string }).error ?? "Commande non enregistrée"),
      });
      enqueue({
        type: "done",
        apiMessages: buildApiMessagesAfterLecotOrder(
          params.messages,
          params.toolCallId,
          "order_lecot_parts",
          JSON.stringify(result),
          String((result as { error?: string }).error),
        ),
      });
      return;
    }

    emitChatbotOrderRegisteredEvents(enqueue, params.companyId, result);

    const text = documentToolSuccessMessage("order_lecot_parts", result);
    enqueue({ type: "text", delta: text });

    const toolJson = stringifyChatbotToolResult("order_lecot_parts", result);
    enqueue({
      type: "done",
      apiMessages: buildApiMessagesAfterLecotOrder(
        params.messages,
        params.toolCallId,
        "order_lecot_parts",
        toolJson,
        text,
      ),
    });
  });
}

/** Stream SSE après exécution d'un outil document (sans OpenAI). */
export function streamDocumentToolOutcome(params: {
  messages: unknown[];
  toolCallId: string;
  toolName: string;
  result: unknown;
}): Response {
  return createChatbotSseResponse(async (enqueue) => {
    const preview = extractDocumentPreviewFromResult(params.result);
    if (preview) {
      enqueue({ type: "document_preview", ...preview });
    }
    const text = documentToolSuccessMessage(params.toolName, params.result);
    enqueue({ type: "text", delta: text });
    const donePayload: { type: "done"; apiMessages?: ChatbotStoredMessage[] } = { type: "done" };
    if (params.messages.length > 0) {
      donePayload.apiMessages = buildApiMessagesAfterDocumentTool(
        params.messages,
        params.toolCallId,
        params.toolName,
        text,
      );
    }
    enqueue(donePayload);
  });
}
