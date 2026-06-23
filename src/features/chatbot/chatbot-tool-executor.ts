import { logCrmFromChatbotTool } from "@/features/crmHistory/logCrmFromChatbotTool";
import {
  requireAdminRoleForSensitiveTool,
  requireConfirmed,
  type ChatbotToolContext,
} from "@/features/chatbot/chatbot-tool-executor-context";
import { tryExecuteChatbotAiTool } from "@/features/chatbot/chatbot-tool-executor-ai-tools";
import { tryExecuteChatbotInterventionTool } from "@/features/chatbot/chatbot-tool-executor-intervention-tools";
import { tryExecuteChatbotOrdersCommsTool } from "@/features/chatbot/chatbot-tool-executor-orders-comms";
import { tryExecuteChatbotWorkspaceTool } from "@/features/chatbot/chatbot-tool-executor-workspace";

export type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor-context";

export async function executeChatbotTool(
  name: string,
  rawInput: unknown,
  ctx: ChatbotToolContext
): Promise<unknown> {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as Record<
    string,
    unknown
  >;
  requireConfirmed(name, input);
  requireAdminRoleForSensitiveTool(name, ctx);
  const result = await executeChatbotToolImpl(name, input, ctx);
  void logCrmFromChatbotTool(name, input, result, ctx);
  return result;
}

async function executeChatbotToolImpl(
  name: string,
  input: Record<string, unknown>,
  ctx: ChatbotToolContext
): Promise<unknown> {
  const handlers = [
    tryExecuteChatbotWorkspaceTool,
    tryExecuteChatbotOrdersCommsTool,
    tryExecuteChatbotInterventionTool,
    tryExecuteChatbotAiTool,
  ] as const;

  for (const handler of handlers) {
    const result = await handler(name, input, ctx);
    if (result !== null) return result;
  }

  throw new Error(`Outil inconnu : ${name}`);
}
