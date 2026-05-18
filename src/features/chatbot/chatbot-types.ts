export type ChatbotChatRole = "user" | "assistant";

export type ChatbotUiMessage = {
  id: string;
  role: ChatbotChatRole;
  content: string;
  createdAt: number;
};

export type ChatbotConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatbotUiMessage[];
  /** Messages bruts Anthropic (tool_use / tool_result) pour reprise API */
  apiMessages?: unknown[];
};

export type ChatbotPendingTool = {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
  summary: string;
};

export type ChatbotStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; tool: string; label: string }
  | { type: "tool_end"; tool: string }
  | { type: "tool_pending"; pending: ChatbotPendingTool }
  | { type: "done"; apiMessages?: unknown[] }
  | { type: "error"; message: string };
