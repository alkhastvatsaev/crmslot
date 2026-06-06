import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
import { buildCrmHistoryAgentSystemPrompt } from "@/features/crmHistory/crmHistoryAgentSystemPrompt";
import type { QmKpiSnapshot } from "@/features/crmHistory/crmHistoryAgentSystemPrompt";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company/types";
import { CRM_HISTORY_AGENT_TOOL_SCOPE } from "@/features/hubAgents/hubAgentToolScopes";

export { CRM_HISTORY_AGENT_TOOL_SCOPE };

export type CrmHistoryAgentPostBody = {
  companyId?: string;
  companyName?: string;
  role?: CompanyRole | null;
  messages?: unknown[];
  activitySnapshot?: string | null;
  kpiSnapshot?: QmKpiSnapshot | null;
};

export type CrmHistoryAgentRouteAuth = { uid: string };

export async function handleCrmHistoryAgentPost(
  body: CrmHistoryAgentPostBody | null,
  auth: CrmHistoryAgentRouteAuth
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

  const system = buildCrmHistoryAgentSystemPrompt({
    companyName,
    companyId,
    today,
    activitySnapshot: body?.activitySnapshot ?? null,
    kpiSnapshot: body?.kpiSnapshot ?? null,
  });

  const toolCtx: ChatbotToolContext = { companyId, actorUid: auth.uid, role };

  return createChatbotSseResponse(async (enqueue) => {
    try {
      const result = await runChatbotOpenAI({
        apiKey,
        modelName,
        system,
        messages,
        toolCtx,
        toolScope: [...CRM_HISTORY_AGENT_TOOL_SCOPE],
        hubAgentMode: true,
        emit: enqueue,
      });
      if (result.status === "pending") {
        enqueue({ type: "tool_pending", pending: result.pending });
      }
      enqueue({ type: "done", apiMessages: result.apiMessages });
    } catch (err) {
      enqueue({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur Agent Historique",
      });
    }
  });
}
