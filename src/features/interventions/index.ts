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
export {
  default as FinishJobStepIndicator,
  type FinishJobStep,
} from "@/features/interventions/components/FinishJobStepIndicator";
export {
  useSmartForm,
  SMART_FORM_MAX_PHOTOS,
  emptyDraft,
  loadStorageDraft,
  type DraftPayload,
  type WizardStep,
} from "@/features/interventions/hooks/useSmartForm";
