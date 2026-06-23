/**
 * API publique featureHub — hub Matériel (stock, agent IA, navigation pager).
 * UI slot carrousel → `components/FeatureHubPage.tsx`.
 */
export { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
export { navigateFeatureHub } from "@/features/featureHub/featureHubNavigation";
export {
  MATERIAL_AGENT_PENDING_QUICK_PROMPT_EVENT,
  peekPendingMaterialAgentQuickPrompt,
  consumePendingMaterialAgentQuickPrompt,
  dispatchChatbotDraftPrompt,
  dispatchChatbotQuickPrompt,
  dispatchMaterialAgentDraftPrompt,
  focusMaterialAgentMobileRail,
  dispatchMaterialAgentQuickPrompt,
  buildStockCenterMaterialOrderPrompt,
  navigateMaterialAgentWithQuickPrompt,
  dispatchBillingAgentDraftPrompt,
  dispatchBillingAgentQuickPrompt,
  navigateToChatbotWithPrompt,
  navigateToBillingAgentWithPrompt,
} from "@/features/featureHub/companyStockChatbot";
export {
  MATERIAL_AGENT_STORAGE_KEY,
  MATERIAL_AGENT_OFF_TOPIC_TEXT,
  MATERIAL_AGENT_OFF_TOPIC_SUGGESTIONS,
  extractMaterialAgentSuggestions,
  stripMaterialAgentSuggestions,
  nextMaterialAgentMessageId,
  loadMaterialAgentApiHistory,
  saveMaterialAgentApiHistory,
  buildMaterialAgentStockSnapshot,
} from "@/features/featureHub/materialAgentHelpers";
export { readMaterialAgentStream } from "@/features/featureHub/materialAgentStream";
export { useMaterialAgent } from "@/features/featureHub/hooks/useMaterialAgent";
export {
  MATERIAL_AGENT_CLIENT_NAME_MARKER,
  MATERIAL_AGENT_ASK_CLIENT_NAME_TEXT,
  materialAgentAskClientNameAssistantContent,
  shouldResetMaterialOrderClientSession,
  isMaterialAgentLecotCommandText,
  isAwaitingMaterialAgentClientName,
  parseMaterialAgentClientNameFromUserText,
  resolveMaterialAgentOrderClientName,
  buildMaterialAgentClientNameRegisteredReply,
} from "@/features/featureHub/materialAgentOrderClient";
export type {
  CompanyStockAgentMessage,
  CompanyStockAgentContext,
  CompanyStockAgentIntent,
  CompanyStockAgentAction,
  CompanyStockAgentTurnResult,
} from "@/features/featureHub/companyStockAgentTypes";
export type { CompanyStockFilter } from "@/features/featureHub/filterCompanyStock";
export {
  isLowStockItem,
  filterStockItemsBySearch,
  filterStockByChip,
  filterStockByCategory,
  applyStockListFilters,
  materialOrdersMatchingStock,
  buildOpenOrderReferenceSet,
} from "@/features/featureHub/filterCompanyStock";
export type {
  StockHealth,
  CompanyStockDashboardMetrics,
} from "@/features/featureHub/companyStockMetrics";
export {
  stockHealth,
  sortStockByPatronPriority,
  computeCompanyStockMetrics,
} from "@/features/featureHub/companyStockMetrics";
export type { StockImageMap } from "@/features/featureHub/hooks/useCompanyStockImages";
export { useCompanyStockImages } from "@/features/featureHub/hooks/useCompanyStockImages";

// Modules consommés cross-feature (audit:barrels:public).
export * from "@/features/featureHub/materialAgentRouteHandler";
