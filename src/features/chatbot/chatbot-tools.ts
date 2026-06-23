export type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

import { CHATBOT_AI_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-ai-definitions";
import { CHATBOT_BILLING_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-billing-definitions";
import { CHATBOT_GMAIL_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-gmail-definitions";
import { CHATBOT_INTERVENTION_WRITE_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-intervention-definitions";
import { CHATBOT_LECOT_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-lecot-definitions";
import { CHATBOT_READ_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-read-definitions";
import { CHATBOT_STOCK_TOOL_DEFINITIONS } from "@/features/chatbot/chatbot-tools-stock-definitions";
import type { ChatbotToolDefinition } from "@/features/chatbot/chatbot-tools-types";

export { CHATBOT_WRITE_TOOLS, isChatbotWriteTool } from "@/features/chatbot/chatbot-tools-write";

/** Outils Chatbot — exécution serveur (Firebase Admin) ; écriture avec confirmation UI. */
export const CHATBOT_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  ...CHATBOT_READ_TOOL_DEFINITIONS,
  ...CHATBOT_GMAIL_TOOL_DEFINITIONS,
  ...CHATBOT_BILLING_TOOL_DEFINITIONS,
  ...CHATBOT_INTERVENTION_WRITE_TOOL_DEFINITIONS,
  ...CHATBOT_LECOT_TOOL_DEFINITIONS,
  ...CHATBOT_STOCK_TOOL_DEFINITIONS,
  ...CHATBOT_AI_TOOL_DEFINITIONS,
];
