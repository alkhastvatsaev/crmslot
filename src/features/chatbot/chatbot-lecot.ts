export type { LecotProductSuggestion } from "@/features/chatbot/chatbot-lecot-catalog";

export {
  LECOT_CHATBOT_SUGGESTION_COUNT,
  buildLecotProductSuggestions,
  searchLecotProductsForChatbot,
  formatLecotSearchReplyForChat,
  runChatbotInstantLecotSearch,
  streamInstantLecotCatalogResponse,
  tryLecotProductFollowUpIntent,
  extractLecotProductQueryFromFollowUp,
  syntheticLecotSku,
  formatProduct,
  loadMergedCatalog,
} from "@/features/chatbot/chatbot-lecot-catalog";

export {
  orderLecotPartsForChatbot,
  listSupplierOrdersForChatbot,
} from "@/features/chatbot/chatbot-lecot-order";
