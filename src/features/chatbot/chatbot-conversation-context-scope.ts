import { shouldPreferChatbotEmailOverLecot } from "@/features/chatbot/chatbot-email-intent";
import {
  extractLecotProductKeyword,
  resolveLecotCatalogSearchQuery,
} from "@/features/chatbot/chatbot-lecot-follow-up";
import { parseLecotInstantOrderIntent } from "@/features/chatbot/chatbot-lecot-instant-order";
import { inferChatbotToolScope } from "@/features/chatbot/chatbot-tool-routing";
import { CHATBOT_TOOL_CORE_NO_SNAPSHOT } from "@/features/chatbot/chatbot-tool-routing";
import type { ChatbotFlowId } from "@/features/chatbot/chatbot-conversation-context-types";
import { CHATBOT_MINIMAL_SNAPSHOT_TOOLS } from "@/features/chatbot/chatbot-conversation-context-types";
import { mergeFlowScopes } from "@/features/chatbot/chatbot-conversation-context-flows";

/**
 * Outils exposés à OpenAI pour le tour courant — le dernier message prime sur l'historique Lecot.
 */
export function resolveTurnToolScope(params: {
  lastUserText: string;
  turnFlows: ChatbotFlowId[];
  hasWorkspaceSnapshot: boolean;
  explicitToolScope?: string[];
  isGreeting: boolean;
}): string[] | undefined {
  if (params.explicitToolScope && params.explicitToolScope.length > 0) {
    let scope = [...params.explicitToolScope];
    if (!params.hasWorkspaceSnapshot && !scope.includes("get_workspace_summary")) {
      scope = [...CHATBOT_TOOL_CORE_NO_SNAPSHOT, ...scope];
    }
    return scope;
  }

  if (params.isGreeting) return [];

  if (shouldPreferChatbotEmailOverLecot(params.lastUserText)) {
    return mergeFlowScopes(["email"]);
  }

  const lecotOnTurn =
    params.turnFlows.includes("lecot") ||
    Boolean(extractLecotProductKeyword(params.lastUserText)) ||
    Boolean(parseLecotInstantOrderIntent(params.lastUserText));

  if (lecotOnTurn && !shouldPreferChatbotEmailOverLecot(params.lastUserText)) {
    return mergeFlowScopes(["lecot"]);
  }

  if (params.turnFlows.length > 0) {
    return mergeFlowScopes(params.turnFlows);
  }

  const inferred = inferChatbotToolScope(params.lastUserText);
  if (inferred !== undefined) return inferred;

  if (params.hasWorkspaceSnapshot) return [...CHATBOT_MINIMAL_SNAPSHOT_TOOLS];
  return undefined;
}

export function resolveLecotSearchQuery(
  lastUserText: string,
  messages: unknown[],
  turnFlows: ChatbotFlowId[]
): string | null {
  if (shouldPreferChatbotEmailOverLecot(lastUserText)) return null;
  if (parseLecotInstantOrderIntent(lastUserText)) return null;
  const lecotOnTurn =
    turnFlows.includes("lecot") ||
    Boolean(extractLecotProductKeyword(lastUserText)) ||
    Boolean(parseLecotInstantOrderIntent(lastUserText));
  if (!lecotOnTurn) return null;
  return resolveLecotCatalogSearchQuery(lastUserText, messages);
}
