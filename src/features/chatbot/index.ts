/**
 * API publique chatbot — imports cross-feature autorisés via ce barrel.
 * Ne pas importer deep dans hooks internes depuis d'autres features.
 */
export { ChatbotProvider, useChatbotContext } from "@/features/chatbot/ChatbotContext";
export { useChatbot } from "@/features/chatbot/hooks/useChatbot";
export {
  runChatbotOpenAI,
  normalizeLecotOrderToolArguments,
} from "@/features/chatbot/chatbot-openai";
export type { OpenAIRunResult } from "@/features/chatbot/chatbot-openai";
export type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotStreamEvent,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";
export type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
export { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
export { CHATBOT_TOOL_LABELS } from "@/features/chatbot/chatbot-tool-labels";
export { isChatbotZeroTokenUiTool } from "@/features/chatbot/chatbot-document-side-effect";
export type { ChatbotClientDocumentAction } from "@/features/chatbot/chatbot-client-document";
export { createChatbotSseResponse } from "@/features/chatbot/chatbot-sse";
export type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
export {
  CHATBOT_DOCUMENT_LABELS,
  isChatbotDocumentKind,
} from "@/features/chatbot/chatbot-document";
export type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";
export type { DocumentPreviewOverlayTarget } from "@/features/chatbot/chatbot-document-preview-ui";
export type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
export {
  GalaxyComposerNewButton,
  GalaxyComposerMicButton,
  GalaxyComposerSendButton,
  galaxyComposerFieldMouseDown,
} from "@/features/chatbot/components/GalaxyComposerControls";

// Modules consommés cross-feature (audit:barrels:public).
export * from "@/features/chatbot/chatbot-gmail";
export * from "@/features/chatbot/chatbot-route-handler";
export * from "@/features/chatbot/chatbot-stored-messages";
export * from "@/features/chatbot/chatbot-message-markdown";
export * from "@/features/chatbot/chatbot-message-trim";
export * from "@/features/chatbot/chatbot-conversation-context";
export {
  resolveDocumentActionTool,
  handleChatbotDocumentActionPost,
  type ChatbotDocumentActionBody,
} from "@/features/chatbot/chatbot-document-action-handler";
export * from "@/features/chatbot/chatbot-email-intent";
export * from "@/features/chatbot/chatbot-intervention-source";
export * from "@/features/chatbot/chatbot-lecot-instant-order-intent";
export * from "@/features/chatbot/chatbot-order-side-effect";
export * from "@/features/chatbot/chatbot-pwa-route";
export * from "@/features/chatbot/chatbot-tools";
export * from "@/features/chatbot/flushPendingLecotEmails";
