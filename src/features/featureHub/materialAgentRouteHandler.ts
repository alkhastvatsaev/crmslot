import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
import { buildMaterialAgentSystemPrompt } from "@/features/featureHub/materialAgentSystemPrompt";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import type { CompanyRole } from "@/features/company/types";

/** Scope fixé côté serveur — le client ne peut pas l'étendre. */
export const MATERIAL_AGENT_TOOL_SCOPE = [
  "get_workspace_summary",
  "list_stock_alerts",
  "list_material_orders",
  "search_lecot_products",
  "order_lecot_parts",
] as const;

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

  const system = buildMaterialAgentSystemPrompt({
    companyName,
    companyId,
    today,
    stockSnapshot: body?.stockSnapshot ?? null,
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
        toolScope: [...MATERIAL_AGENT_TOOL_SCOPE],
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
