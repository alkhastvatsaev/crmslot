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
export { assignInterventionToTechnician } from "@/features/interventions/assignInterventionToTechnician";
export {
  canTransitionInterventionStatus,
  buildStatusTransitionPatch,
} from "@/features/interventions/workflow/interventionWorkflow";
