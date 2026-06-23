/**
 * API serveur crmHistory — journalisation Admin SDK (routes API uniquement).
 */
export { logCrmInterventionActionAdmin } from "@/features/crmHistory/logCrmInterventionActionAdmin";
export { logCrmFromChatbotTool } from "@/features/crmHistory/logCrmFromChatbotTool";
export {
  logCrmSupplierOrderPlacedAdmin,
  logCrmMaterialOrderPlacedAdmin,
  logCrmMaterialOrderApprovedAdmin,
} from "@/features/crmHistory/logCrmSupplierAndMaterialOrder";
