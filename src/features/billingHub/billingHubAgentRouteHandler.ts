import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
import { buildBillingHubAgentSystemPrompt } from "@/features/billingHub/billingHubAgentSystemPrompt";
import { handleBillingHubPwaIntentRoute } from "@/features/billingHub/billingHubPwaRoute";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company/types";
import { BILLING_HUB_AGENT_TOOL_SCOPE } from "@/features/hubAgents/hubAgentToolScopes";

export { BILLING_HUB_AGENT_TOOL_SCOPE };

export type BillingHubAgentPostBody = {
  companyId?: string;
  companyName?: string;
  role?: CompanyRole | null;
  messages?: unknown[];
  billingSnapshot?: string | null;
  /** Dossier sélectionné dans la liste facturation (prioritaire pour « ce dossier »). */
  focusInterventionId?: string | null;
};

export type BillingHubAgentRouteAuth = { uid: string };

export async function handleBillingHubAgentPost(
  body: BillingHubAgentPostBody | null,
  auth: BillingHubAgentRouteAuth,
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

  const system = buildBillingHubAgentSystemPrompt({
    companyName,
    companyId,
    today,
    billingSnapshot: body?.billingSnapshot ?? null,
  });

  const toolCtx: ChatbotToolContext = { companyId, actorUid: auth.uid, role };
  const focusInterventionId = (body?.focusInterventionId ?? "").trim() || null;

  const pwaResponse = await handleBillingHubPwaIntentRoute({
    messages,
    companyId,
    companyName,
    role,
    toolCtx,
    focusInterventionId,
  });
  if (pwaResponse) return pwaResponse;

  return createChatbotSseResponse(async (enqueue) => {
    try {
      const result = await runChatbotOpenAI({
        apiKey,
        modelName,
        system,
        messages,
        toolCtx,
        toolScope: [...BILLING_HUB_AGENT_TOOL_SCOPE],
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
        message: err instanceof Error ? err.message : "Erreur Agent Facturation",
      });
    }
  });
}
