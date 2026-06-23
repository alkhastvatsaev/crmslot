import { isChatbotGreetingMessage } from "@/features/chatbot/chatbot-greeting";
import { shouldPreferChatbotEmailOverLecot } from "@/features/chatbot/chatbot-email-intent";
import { resolveChatbotTurnDirective } from "@/features/chatbot/chatbot-email-intent";
import {
  conversationNeedsChatbotTools,
  recentUserMessagesText,
} from "@/features/chatbot/chatbot-latency";
import {
  CHATBOT_MINIMAL_SNAPSHOT_TOOLS,
  type ChatbotConversationContext,
  type ResolveChatbotConversationContextParams,
} from "@/features/chatbot/chatbot-conversation-context-types";
import {
  detectFlowsFromToolHistory,
  resolveTurnFlows,
} from "@/features/chatbot/chatbot-conversation-context-flows";
import {
  lastUserTextFromMessages,
  recentDialogText,
} from "@/features/chatbot/chatbot-conversation-context-messages";
import {
  resolveLecotSearchQuery,
  resolveTurnToolScope,
} from "@/features/chatbot/chatbot-conversation-context-scope";

/**
 * Point unique : historique complet → scope outils, fils actifs, actions instantanées.
 */
export function resolveChatbotConversationContext(
  params: ResolveChatbotConversationContextParams
): ChatbotConversationContext {
  const lastUserText = lastUserTextFromMessages(params.messages);
  const recentUserText = recentUserMessagesText(params.messages, 4);
  const dialogText = recentDialogText(params.messages, 8);
  const isGreeting = Boolean(lastUserText && isChatbotGreetingMessage(lastUserText));

  const turnFlows = resolveTurnFlows(lastUserText, params.messages);
  const activeFlows = [...new Set([...turnFlows, ...detectFlowsFromToolHistory(params.messages)])];
  const turnDirective = resolveChatbotTurnDirective(lastUserText);

  const needsTools =
    turnFlows.length > 0 ||
    conversationNeedsChatbotTools(lastUserText, params.messages) ||
    detectFlowsFromToolHistory(params.messages).length > 0;

  let toolScope = resolveTurnToolScope({
    lastUserText,
    turnFlows,
    hasWorkspaceSnapshot: params.hasWorkspaceSnapshot,
    explicitToolScope: params.explicitToolScope,
    isGreeting,
  });

  if (params.hasWorkspaceSnapshot && !needsTools && !isGreeting) {
    toolScope = [...CHATBOT_MINIMAL_SNAPSHOT_TOOLS];
  }

  const lecotSearchQuery = resolveLecotSearchQuery(lastUserText, params.messages, turnFlows);
  const forceToolName =
    lecotSearchQuery &&
    !shouldPreferChatbotEmailOverLecot(lastUserText) &&
    (toolScope === undefined || toolScope.includes("search_lecot_products"))
      ? "search_lecot_products"
      : null;

  return {
    lastUserText,
    recentUserText,
    recentDialogText: dialogText,
    activeFlows,
    toolScope,
    needsTools,
    forceToolName,
    lecotSearchQuery,
    isGreeting,
    turnDirective,
  };
}
