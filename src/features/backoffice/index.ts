/**
 * API publique backoffice — inbox, interventions société et chat portail.
 */
export { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
export type { BackOfficeInterventionsCompanyScope } from "@/features/backoffice/useBackOfficeInterventions";
export { assignInterventionFromBackoffice } from "@/features/backoffice/assignInterventionFromBackoffice";
export type {
  AssignInterventionSchedule,
  AssignInterventionResult,
} from "@/features/backoffice/assignInterventionFromBackoffice";
export { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
export { canApplyBackofficeTechnicianAssignment } from "@/features/backoffice/applyBackofficeTechnicianAssignmentShared";
export { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";
export { navigateBackOfficeHub } from "@/features/backoffice/backofficeHubNavigation";
export { openBackofficeIntervention } from "@/features/backoffice/openBackofficeIntervention";
export { unknownTimestampToMs } from "@/features/backoffice/timeHelpers";
export {
  PORTAL_CHAT_COLLECTION,
  subscribePortalChatMessages,
  subscribePortalChatForIntervention,
} from "@/features/backoffice/portalChatFirestore";
export type { PortalChatDoc, PortalChatRole } from "@/features/backoffice/portalChatFirestore";

// Modules consommés cross-feature (audit:barrels:public).
export * from "@/features/backoffice/useResolvedInterventionAudio";
