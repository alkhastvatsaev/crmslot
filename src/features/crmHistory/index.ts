/**
 * API publique crmHistory — historique CRM unifié, feeds et journalisation actions.
 * UI slot pager → `components/CrmHistoryPage.tsx`.
 */
export { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
export type {
  CrmEventType,
  CrmPeriodFilter,
  CrmTypeFilter,
  CrmActivityEvent,
} from "@/features/crmHistory/crmActivityTypes";
export { useCrmActivityFeed } from "@/features/crmHistory/hooks/useCrmActivityFeed";
export { useActivityLog } from "@/features/crmHistory/useActivityLog";
export {
  logCrmInterventionAction,
  type CompanyCrmActivityKind,
} from "@/features/crmHistory/logCrmInterventionAction";
export {
  logCrmInterventionCreated,
  type InterventionCreatedSource,
} from "@/features/crmHistory/logCrmInterventionCreated";
export { logCrmCompanyAction } from "@/features/crmHistory/logCrmCompanyAction";
export { logCrmAfterDocumentBilling } from "@/features/crmHistory/logCrmAfterDocumentBilling";
export {
  CRMSLOT_CRM_ORDERS_CHANGED_EVENT,
  dispatchCrmOrdersChanged,
} from "@/features/crmHistory/crmOrdersChangedEvent";
export type { CrmOrdersChangedDetail } from "@/features/crmHistory/crmOrdersChangedEvent";
export {
  formatSelectedDate,
  formatDateTime,
} from "@/features/crmHistory/components/crmHistoryEventDetailFormat";
export { default as CrmHistoryPage } from "@/features/crmHistory/components/CrmHistoryPage";
export { default as CrmHistoryGalaxyComposer } from "@/features/crmHistory/components/CrmHistoryGalaxyComposer";
