import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
import { buildVehicleStockAgentSystemPrompt } from "@/features/stock/vehicleStockAgentSystemPrompt";
import type { ChatbotToolContext } from "@/features/chatbot";
import { VEHICLE_STOCK_AGENT_TOOL_SCOPE } from "@/features/hubAgents/hubAgentToolScopes";

export type VehicleStockAgentPostBody = {
  companyId?: string;
  companyName?: string;
  messages?: unknown[];
};

export type VehicleStockAgentRouteAuth = { uid: string };

export async function handleVehicleStockAgentPost(
  body: VehicleStockAgentPostBody | null,
  auth: VehicleStockAgentRouteAuth
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
  const today = new Date().toISOString().slice(0, 10);
  const modelName = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const system = buildVehicleStockAgentSystemPrompt({
    companyName,
    companyId,
    technicianUid: auth.uid,
    today,
  });

  const toolCtx: ChatbotToolContext = { companyId, actorUid: auth.uid, role: null };

  return createChatbotSseResponse(async (enqueue) => {
    try {
      const result = await runChatbotOpenAI({
        apiKey,
        modelName,
        system,
        messages,
        toolCtx,
        toolScope: [...VEHICLE_STOCK_AGENT_TOOL_SCOPE],
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
        message: err instanceof Error ? err.message : "Erreur Agent Stock Véhicule",
      });
    }
  });
}
