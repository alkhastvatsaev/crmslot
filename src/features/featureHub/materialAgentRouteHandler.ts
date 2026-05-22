import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { resolveChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import { lastUserMessageText } from "@/features/chatbot/chatbot-route-handler";
import { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
import { streamInstantLecotCatalogResponse } from "@/features/chatbot/chatbot-lecot";
import { buildMaterialAgentSystemPrompt } from "@/features/featureHub/materialAgentSystemPrompt";
import { resolveMaterialAgentLecotSearchQuery } from "@/features/featureHub/materialAgentLecotQuery";
import {
  buildMaterialAgentClientNameRegisteredReply,
  isAwaitingMaterialAgentClientName,
  parseMaterialAgentClientNameFromUserText,
  resolveMaterialAgentOrderClientName,
  shouldResetMaterialOrderClientSession,
} from "@/features/featureHub/materialAgentOrderClient";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company/types";
import { MATERIAL_AGENT_TOOL_SCOPE } from "@/features/hubAgents/hubAgentToolScopes";

export { MATERIAL_AGENT_TOOL_SCOPE };

export type MaterialAgentPostBody = {
  companyId?: string;
  companyName?: string;
  role?: CompanyRole | null;
  messages?: unknown[];
  /** Nom client mémorisé pour cette session (obligatoire avant commande). */
  orderClientName?: string | null;
  /** Snapshot JSON du stock courant pour enrichir le system prompt (optionnel). */
  stockSnapshot?: string | null;
};

export type MaterialAgentRouteAuth = { uid: string };

function streamMaterialAgentClientNameRegistered(
  messages: unknown[],
  clientName: string,
): Response {
  return createChatbotSseResponse(async (enqueue) => {
    const reply = buildMaterialAgentClientNameRegisteredReply(clientName);
    const stored = normalizeStoredMessages(messages);
    enqueue({ type: "material_order_client", clientName });
    enqueue({ type: "text", delta: reply });
    enqueue({
      type: "done",
      apiMessages: [...stored, { role: "assistant", content: reply }],
    });
  });
}

export async function handleMaterialAgentPost(
  body: MaterialAgentPostBody | null,
  auth: MaterialAgentRouteAuth,
): Promise<Response> {
  const companyId = (body?.companyId ?? "").trim();
  if (!companyId) {
    return new Response(JSON.stringify({ error: "companyId requis" }), { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? [...body!.messages!] : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages requis" }), { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  if (!apiKey) {
    return createChatbotSseResponse(async (enqueue) => {
      enqueue({ type: "error", message: "OPENAI_API_KEY manquante." });
    });
  }

  const companyName = (body?.companyName ?? "Société").trim() || "Société";
  const role = body?.role ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const modelName = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const conversationCtx = resolveChatbotConversationContext({
    messages,
    hasWorkspaceSnapshot: false,
    explicitToolScope: [...MATERIAL_AGENT_TOOL_SCOPE],
  });

  const lastUser = (conversationCtx.lastUserText ?? lastUserMessageText(messages) ?? "").trim();

  const resetClientSession = shouldResetMaterialOrderClientSession(lastUser);
  const orderClientName = resolveMaterialAgentOrderClientName({
    orderClientNameFromClient: resetClientSession ? null : body?.orderClientName,
    messages,
    lastUserText: lastUser,
  });

  const system = buildMaterialAgentSystemPrompt({
    companyName,
    companyId,
    today,
    stockSnapshot: body?.stockSnapshot ?? null,
    orderClientName,
  });

  const toolCtx: ChatbotToolContext = {
    companyId,
    actorUid: auth.uid,
    role,
    lastUserText: lastUser,
    materialOrderClientName: orderClientName,
    requireMaterialOrderClientName: true,
  };

  const toolScope = [...MATERIAL_AGENT_TOOL_SCOPE];

  const parsedClientReply = parseMaterialAgentClientNameFromUserText(lastUser, messages);
  if (parsedClientReply && isAwaitingMaterialAgentClientName(messages)) {
    return streamMaterialAgentClientNameRegistered(messages, parsedClientReply);
  }

  // Raccourci catalogue Lecot : réponse déterministe sans OpenAI.
  // Couvre "commande lecot", "catalogue", "suggère des produits", "cylindre lecot", etc.
  const lecotCatalogQuery = resolveMaterialAgentLecotSearchQuery(lastUser, messages);
  if (lecotCatalogQuery) {
    return createChatbotSseResponse(async (enqueue) => {
      if (resetClientSession) {
        enqueue({ type: "material_order_client", clientName: "" });
      }
      await streamInstantLecotCatalogResponse({
        companyId,
        query: lecotCatalogQuery,
        messages,
        enqueue,
      });
    });
  }

  return createChatbotSseResponse(async (enqueue) => {
    if (resetClientSession) {
      enqueue({ type: "material_order_client", clientName: "" });
    }
    try {
      const result = await runChatbotOpenAI({
        apiKey,
        modelName,
        system,
        messages,
        toolCtx,
        toolScope,
        conversationContext: { ...conversationCtx, toolScope },
        hasWorkspaceSnapshot: false,
        hubAgentMode: true,
        temperature: 0.15,
        emit: enqueue,
      });
      if (result.status === "pending") {
        enqueue({ type: "tool_pending", pending: result.pending });
      }
      enqueue({ type: "done", apiMessages: result.apiMessages });
    } catch (err) {
      enqueue({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur Agent Matériel",
      });
    }
  });
}
