export type SerrAIChatRole = "user" | "assistant";

export type SerrAIUiMessage = {
  id: string;
  role: SerrAIChatRole;
  content: string;
  createdAt: number;
};

export type SerrAIConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: SerrAIUiMessage[];
  /** Messages bruts Anthropic (tool_use / tool_result) pour reprise API */
  apiMessages?: unknown[];
};

export type SerrAIPendingTool = {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
  summary: string;
};

export type SerrAIStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_pending"; pending: SerrAIPendingTool }
  | { type: "done"; apiMessages?: unknown[] }
  | { type: "error"; message: string };
