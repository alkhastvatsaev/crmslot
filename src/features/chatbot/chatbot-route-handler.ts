import { buildChatbotSystemPrompt } from "@/features/chatbot/chatbot-system-prompt";
import { isWorkspaceCopilotSnapshot } from "@/features/chatbot/chatbot-snapshot-prompt";
import { isChatbotZeroTokenUiTool } from "@/features/chatbot/chatbot-document-side-effect";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { handleChatbotPwaIntentRoute } from "@/features/chatbot/chatbot-pwa-route";
import { appendChatbotToolRoundResult } from "@/features/chatbot/chatbot-message-trim";
import { resolveChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import { buildChatbotPostToolReply } from "@/features/chatbot/chatbot-post-tool-reply";
import { extractDocumentPreviewFromResult } from "@/features/chatbot/chatbot-document-side-effect";
import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";
import { stringifyChatbotToolResult } from "@/features/chatbot/compactChatbotToolResult";
import { appendChatbotTrainingLog } from "@/features/chatbot/training/appendChatbotTrainingLog";
import { extractChatbotTrainingTurn } from "@/features/chatbot/training/extractChatbotTrainingTurn";
import { isChatbotGreetingMessage } from "@/features/chatbot/chatbot-greeting";
import { normalizeSendInterventionEmailArguments } from "@/features/chatbot/chatbot-email-attach";
import {
  createChatbotSseResponse,
  streamDocumentToolOutcome,
  streamLecotOrderToolOutcome,
} from "@/features/chatbot/chatbot-sse";
import type { CompanyRole } from "@/features/company/types";

export type ChatbotPostBody = {
  companyId?: string;
  companyName?: string;
  role?: CompanyRole | null;
  messages?: unknown[];
  workspaceSnapshot?: unknown;
  confirmTool?: {
    toolUseId?: string;
    name?: string;
    input?: Record<string, unknown>;
  };
  toolScope?: string[];
  /** Id conversation côté PWA (localStorage) — corrélation export / entraînement. */
  conversationId?: string | null;
  /** Dossier ouvert (panneau mission / PDF) — contexte pour le modèle. */
  focusInterventionId?: string | null;
};

export type ChatbotRouteAuth = {
  uid: string;
};

/** Dernier message utilisateur (texte) dans l'historique API. */
export function lastUserMessageText(messages: unknown[]): string | null {
  const stored = normalizeStoredMessages(messages);
  for (let i = stored.length - 1; i >= 0; i -= 1) {
    const m = stored[i];
    if (m.role === "user" && typeof m.content === "string" && m.content.trim()) {
      return m.content.trim();
    }
  }
  return null;
}

/** Scope explicite depuis le body ; sinon laisser le serveur inférer (`undefined`). */
export function resolveChatbotToolScopeFromBody(
  body: ChatbotPostBody | null,
  _messages: unknown[],
  _hasSnapshot: boolean,
): string[] | undefined {
  if (Array.isArray(body?.toolScope) && body.toolScope.length > 0) {
    return body.toolScope;
  }
  return undefined;
}

function resolveOpenAIApiKey(): string {
  return process.env.OPENAI_API_KEY?.trim() || "";
}


export async function handleChatbotPost(
  body: ChatbotPostBody | null,
  auth: ChatbotRouteAuth,
): Promise<Response> {
  try {
    return await handleChatbotPostInner(body, auth);
  } catch (err: unknown) {
    console.error("[chatbot/route]", err);
    const message = err instanceof Error ? err.message : "Erreur serveur chatbot";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleChatbotPostInner(
  body: ChatbotPostBody | null,
  auth: ChatbotRouteAuth,
): Promise<Response> {
  const companyId = (body?.companyId ?? "").trim();
  const companyName = (body?.companyName ?? "Société").trim() || "Société";
  const role = body?.role ?? null;
  const messages = Array.isArray(body?.messages) ? [...body!.messages!] : [];

  if (!companyId) {
    return new Response(JSON.stringify({ error: "companyId requis" }), { status: 400 });
  }

  const toolCtx = { companyId, actorUid: auth.uid, role, lastUserText: null as string | null };

  if (body?.confirmTool?.name === "order_lecot_parts") {
    const input = { ...(body.confirmTool.input ?? {}), userConfirmed: true };
    return streamLecotOrderToolOutcome({
      messages,
      toolCallId: body.confirmTool.toolUseId ?? "order_lecot_parts",
      companyId,
      input,
      toolCtx,
    });
  }

  if (body?.confirmTool?.name && isChatbotZeroTokenUiTool(body.confirmTool.name)) {
    const input = { ...(body.confirmTool.input ?? {}), userConfirmed: true };
    const result = await executeChatbotTool(body.confirmTool.name, input, toolCtx).catch(
      (err: unknown) => ({
        error: err instanceof Error ? err.message : "Erreur",
      }),
    );
    return streamDocumentToolOutcome({
      messages,
      toolCallId: body.confirmTool.toolUseId ?? body.confirmTool.name,
      toolName: body.confirmTool.name,
      result,
    });
  }

  if (body?.confirmTool?.name && body.confirmTool.name !== "order_lecot_parts") {
    const toolName = body.confirmTool.name;
    const toolCallId = body.confirmTool.toolUseId ?? toolName;
    const input = { ...(body.confirmTool.input ?? {}), userConfirmed: true };
    toolCtx.lastUserText = lastUserMessageText(messages);
    if (toolName === "send_intervention_email") {
      normalizeSendInterventionEmailArguments(input, toolCtx.lastUserText);
    }
    const result = await executeChatbotTool(toolName, input, toolCtx).catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "Erreur",
    }));
    const assistantText = buildChatbotPostToolReply(toolName, result);
    const apiMessages = appendChatbotToolRoundResult(
      normalizeStoredMessages(messages),
      toolCallId,
      toolName,
      stringifyChatbotToolResult(toolName, result),
      assistantText,
    );
    return createChatbotSseResponse(async (enqueue) => {
      const preview = extractDocumentPreviewFromResult(result);
      if (preview) enqueue({ type: "document_preview", ...preview });
      if (toolName === "order_lecot_parts") {
        emitChatbotOrderRegisteredEvents(enqueue, companyId, result);
      }
      enqueue({ type: "text", delta: assistantText });
      enqueue({ type: "done", apiMessages });
    });
  }

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages requis" }), { status: 400 });
  }

  const workspaceSnapshot = isWorkspaceCopilotSnapshot(body?.workspaceSnapshot)
    ? body.workspaceSnapshot
    : null;

  const hasSnapshot = workspaceSnapshot !== null;
  const conversationCtx = resolveChatbotConversationContext({
    messages,
    hasWorkspaceSnapshot: hasSnapshot,
    explicitToolScope:
      Array.isArray(body?.toolScope) && body.toolScope.length > 0 ? body.toolScope : undefined,
  });

  const lastUser = conversationCtx.lastUserText.trim();
  toolCtx.lastUserText = lastUser || lastUserMessageText(messages);
  const focusInterventionId = (body?.focusInterventionId ?? "").trim() || undefined;

  if ((hasSnapshot || focusInterventionId) && !isChatbotGreetingMessage(lastUser)) {
    const pwaResponse = await handleChatbotPwaIntentRoute({
      lastUserText: lastUser,
      messages,
      workspaceSnapshot,
      toolCtx,
      billingCtx: { focusInterventionId },
    });
    if (pwaResponse) return pwaResponse;
  }

  const openAIKey = resolveOpenAIApiKey();
  if (!openAIKey) {
    return createChatbotSseResponse(async (enqueue) => {
      enqueue({
        type: "error",
        message: "OPENAI_API_KEY manquante. Ajoutez-la dans .env.local.",
      });
    });
  }

  const modelName = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const today = new Date().toISOString().slice(0, 10);
  const system = buildChatbotSystemPrompt({
    companyName,
    companyId,
    role,
    today,
    workspaceSnapshot,
    focusInterventionId: (body?.focusInterventionId ?? "").trim() || undefined,
    turnDirective: conversationCtx.turnDirective,
  });

  const toolScope = conversationCtx.toolScope;

  return createChatbotSseResponse(async (enqueue) => {
    const result = await runChatbotOpenAI({
      apiKey: openAIKey,
      modelName,
      system,
      messages,
      toolCtx,
      toolScope,
      conversationContext: conversationCtx,
      hasWorkspaceSnapshot: hasSnapshot,
      emit: (ev) => enqueue(ev),
    });

    if (result.status === "pending") {
      enqueue({ type: "tool_pending", pending: result.pending });
    } else if (result.status === "done") {
      const turn = extractChatbotTrainingTurn(result.apiMessages);
      if (turn) {
        void appendChatbotTrainingLog({
          companyId,
          actorUid: auth.uid,
          modelName,
          conversationId: body?.conversationId ?? null,
          turn,
        });
      }
    }
    enqueue({ type: "done", apiMessages: result.apiMessages });
  });
}
