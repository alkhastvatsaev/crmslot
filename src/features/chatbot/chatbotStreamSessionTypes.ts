import type { Dispatch, SetStateAction } from "react";
import type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotStreamEvent,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";
import type { ChatbotClientDocumentAction } from "@/features/chatbot/chatbot-client-document";
import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot";

export type ChatbotStreamCtx = {
  accText: { v: string };
  nextApi: { v: unknown[] };
  streamError: { v: string | null };
};

export type UseChatbotStreamSessionArgs = {
  companyId: string | null;
  companyName: string | null;
  role: string | null;
  storageKey: string;
  conversations: ChatbotConversation[];
  setConversations: Dispatch<SetStateAction<ChatbotConversation[]>>;
  workspaceSnapshot: WorkspaceCopilotSnapshot | null | undefined;
  focusInterventionId: string | null;
  appendToConversation: (
    convId: string,
    patch: {
      uiMessages?: ChatbotUiMessage[];
      apiMessages?: unknown[];
      title?: string;
    }
  ) => void;
  openDocumentPreview: (
    interventionId: string,
    documentType: ChatbotDocumentKind,
    force?: boolean
  ) => void;
  openSupplierOrdersPanel: (
    highlightOrderId?: string | null,
    materialOrderId?: string | null,
    previewOrder?: boolean
  ) => void;
  ensureRightPanelOpen: () => void;
  refreshRegistry: () => void;
  openSupplierOrderPdf: (companyId: string, orderId: string, force?: boolean) => Promise<void>;
  setPageIndex: ((index: number) => void) | undefined;
  setStreaming: Dispatch<SetStateAction<boolean>>;
  setStreamingText: Dispatch<SetStateAction<string>>;
  setActiveTool: Dispatch<SetStateAction<{ tool: string; label: string } | null>>;
  setPendingTool: Dispatch<SetStateAction<ChatbotPendingTool | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export type ChatbotStreamEventHandlerDeps = Pick<
  UseChatbotStreamSessionArgs,
  | "ensureRightPanelOpen"
  | "openDocumentPreview"
  | "openSupplierOrderPdf"
  | "openSupplierOrdersPanel"
  | "refreshRegistry"
  | "setPageIndex"
  | "setActiveTool"
  | "setPendingTool"
  | "setStreamingText"
  | "setError"
> & {
  streamQuickActionsRef: {
    current: import("@/features/chatbot/chatbot-quick-actions").ChatbotQuickAction[];
  };
};

export type { ChatbotStreamEvent, ChatbotClientDocumentAction };
