/**
 * API publique interventions — types et helpers stables pour cross-feature.
 */
export type { Intervention, InterventionEvent } from "@/features/interventions/types";
export {
  interventionClientLabel,
  statusLabelKey,
  formatScheduledTimeOnly,
  interventionMatchesTab,
  interventionVisibleInTechnicianMissionList,
  isInterventionReleasedToTechnicianField,
  isInterventionVisibleOnTechnicianMap,
  isInterventionInBackofficeRequestsQueue,
  coerceFirestoreLikeDate,
} from "@/features/interventions/technicianSchedule";
export {
  buildAssignInterventionToTechnicianUpdate,
  type AssignInterventionToTechnicianUpdate,
  type AssignScheduleOverride,
} from "@/features/interventions/assignInterventionToTechnician";
export {
  TECHNICIAN_MOBILE_APP_ROUTE,
  TECHNICIAN_MOBILE_APP_SLOT_INDEX,
  isTechnicianMobileAppPath,
} from "@/features/interventions/technicianMobileAppConstants";
export {
  canTransitionInterventionStatus,
  buildStatusTransitionPatch,
} from "@/features/interventions/workflow/interventionWorkflow";
export type {
  WorkflowOwnerRole,
  InterventionStatusEvent,
  TransitionActor,
} from "@/features/interventions/workflow/interventionWorkflowTypes";
export type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
export type { BillingLine } from "@/features/interventions/components/TechnicianBillingLinesForm";
export type { UnifiedDrawerTab } from "@/features/interventions/components/UnifiedInterventionDrawer";
export type {
  RequesterProfile,
  RequesterType,
  InterventionRequestData,
} from "@/context/RequesterHubContext";
export type {
  PortalAccessSession,
  PortalAccessSessionCase,
} from "@/features/interventions/portalAccessSession";
export {
  readPortalAccessSession,
  writePortalAccessSession,
} from "@/features/interventions/portalAccessSession";
export type { PortalInterventionSummary } from "@/features/interventions/portalToken";
export { generatePortalAccessToken, toPortalSummary } from "@/features/interventions/portalToken";
export { TERMINAL_INTERVENTION_STATUSES } from "@/features/interventions/workflow/interventionWorkflowTypes";
export {
  TERRAIN_TEMPLATES,
  BILLING_TEMPLATES,
  type TerrainTemplate,
  type TerrainTemplateLine,
  type BillingTemplate,
  type BillingTemplateLine,
} from "@/features/interventions/config/terrainTemplates";
export {
  transitionInterventionFromTechnician,
  serializeTechnicianExtraPatchForApi,
  type TransitionInterventionFromTechnicianParams,
} from "@/features/interventions/workflow/transitionInterventionFromTechnician";
export {
  technicianTransitionActor,
  dispatcherTransitionActor,
  requireAuthTransitionActor,
} from "@/features/interventions/workflow/workflowActor";

// Modules consommés cross-feature (audit:barrels:public).
export * from "@/features/interventions/resolveInterventionClientName";
export * from "@/features/interventions/technicianAssignmentServerAuth";
export * from "@/features/interventions/technicianInvoicedReportAmend";
export * from "@/features/interventions/interventionLocation";
export * from "@/features/interventions/optimizeTourOrder";
export * from "@/features/interventions/technicianHubNavigation";
export * from "@/features/interventions/buildInterventionReportPdf";
export * from "@/features/interventions/completionPhotoUrls";
export * from "@/features/interventions/completionUploadCore";
export * from "@/features/interventions/defaultAssignedTechnicianUid";
export * from "@/features/interventions/ensurePortalAccessToken";
export * from "@/features/interventions/recordDuplicateAlertIfNeeded";
export * from "@/features/interventions/requestAutoAssignIntervention";
export * from "@/features/interventions/technicianAssignmentActions";
export * from "@/features/interventions/technicianAssignmentSyncEvents";
export * from "@/features/interventions/technicianCompletionReport";
export * from "@/features/interventions/technicianInvoiceQuickAdjust";
export * from "@/features/interventions/technicianMobileProfileLabel";
export * from "@/features/interventions/useBrowserSpeechDictation";
export * from "@/features/interventions/useInterventionLive";
export * from "@/features/interventions/useTechnicianAssignments";
