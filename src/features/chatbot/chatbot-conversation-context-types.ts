import type { ChatbotTurnDirective } from "@/features/chatbot/chatbot-email-intent";

export type ChatbotFlowId =
  | "lecot"
  | "billing"
  | "email"
  | "planning"
  | "stats"
  | "inbox"
  | "gmail"
  | "stock";

export type ChatbotConversationContext = {
  lastUserText: string;
  recentUserText: string;
  recentDialogText: string;
  activeFlows: ChatbotFlowId[];
  toolScope: string[] | undefined;
  needsTools: boolean;
  forceToolName: string | null;
  lecotSearchQuery: string | null;
  isGreeting: boolean;
  /** Consigne système pour ce tour (priorité email vs Lecot). */
  turnDirective: ChatbotTurnDirective;
};

export type ResolveChatbotConversationContextParams = {
  messages: unknown[];
  hasWorkspaceSnapshot: boolean;
  explicitToolScope?: string[];
};

export type ChatbotStoredMessage = {
  role: string;
  content?: string | null;
  tool_calls?: Array<{ id: string; name: string; arguments?: Record<string, unknown> }>;
  tool_call_id?: string;
};

/** Avec snapshot PWA : recherche dossier même sans fil métier actif. */
export const CHATBOT_MINIMAL_SNAPSHOT_TOOLS = [
  "search_workspace",
  "get_intervention_detail",
  "get_client_detail",
] as const;
