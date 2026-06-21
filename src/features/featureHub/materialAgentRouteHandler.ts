import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { resolveChatbotConversationContext } from "@/features/chatbot/chatbot-conversation-context";
import { lastUserMessageText } from "@/features/chatbot/chatbot-route-handler";
import { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
import { buildMaterialAgentSystemPrompt } from "@/features/featureHub/materialAgentSystemPrompt";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company/types";
import { MATERIAL_AGENT_TOOL_SCOPE } from "@/features/hubAgents/hubAgentToolScopes";
import { parseInterventionMaterialOrderIntent } from "@/features/materials/interventionMaterialOrderPrompt";

export { MATERIAL_AGENT_TOOL_SCOPE };

export type MaterialAgentPostBody = {
  companyId?: string;
  companyName?: string;
  role?: CompanyRole | null;
  messages?: unknown[];
  /** Snapshot JSON du stock courant pour enrichir le system prompt (optionnel). */
  stockSnapshot?: string | null;
};

export type MaterialAgentRouteAuth = { uid: string };

export async function handleMaterialAgentPost(
  body: MaterialAgentPostBody | null,
  auth: MaterialAgentRouteAuth
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

  const interventionOrder = parseInterventionMaterialOrderIntent(lastUser);
  const isInterventionDirectOrder = Boolean(interventionOrder);
  // "Commander N× "label" (réf. SKU) — société : X" → commande directe depuis le modal stock.
  const isModalDirectOrder =
    /^commander\s+\d+[×x]\s+"/i.test(lastUser) && !isInterventionDirectOrder;

  const system = buildMaterialAgentSystemPrompt({
    companyName,
    companyId,
    today,
    stockSnapshot: body?.stockSnapshot ?? null,
    lecotCatalogHint: conversationCtx.lecotSearchQuery,
    interventionOrder,
  });

  const toolCtx: ChatbotToolContext = {
    companyId,
    actorUid: auth.uid,
    role,
    lastUserText: lastUser,
    materialOrderClientName: interventionOrder?.clientName ?? companyName,
    materialOrderInterventionId: interventionOrder?.interventionId ?? null,
    requireMaterialOrderClientName: false,
  };

  const toolScope = [...MATERIAL_AGENT_TOOL_SCOPE];

  return createChatbotSseResponse(async (enqueue) => {
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
        skipLecotChainGuard: isModalDirectOrder || isInterventionDirectOrder,
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
