/**
 * API publique chatbot — imports cross-feature autorisés via ce barrel.
 * Ne pas importer deep dans hooks internes depuis d'autres features.
 */
export { ChatbotProvider, useChatbotContext } from "@/features/chatbot/ChatbotContext";
export { useChatbot } from "@/features/chatbot/hooks/useChatbot";
export type { OpenAIRunResult } from "@/features/chatbot/chatbot-openai";
export type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotStreamEvent,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";
export type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
export { CHATBOT_TOOL_LABELS } from "@/features/chatbot/chatbot-tool-labels";
export { isChatbotZeroTokenUiTool } from "@/features/chatbot/chatbot-document-side-effect";
export type { ChatbotClientDocumentAction } from "@/features/chatbot/chatbot-client-document";
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
