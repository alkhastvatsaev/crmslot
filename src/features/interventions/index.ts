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
export { default as TechnicianMobileApp } from "@/features/interventions/components/TechnicianMobileApp";
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
