/**
 * API serveur interventions — Admin SDK, portail, e2e seed (routes API / cron uniquement).
 */
export { e2eSeedAssignedInterventionAdmin } from "@/features/interventions/server/e2eSeedAssignedIntervention";
export { e2eSeedDoneInterventionAdmin } from "@/features/interventions/server/e2eSeedDoneIntervention";
export { isE2eSeedAllowed } from "@/features/interventions/server/e2eSeedConfig";
export {
  e2eSeedPortalQuoteAdmin,
  type E2eSeedPortalQuoteResult,
  type E2ePortalQuoteScenario,
} from "@/features/interventions/server/e2eSeedPortalQuote";
export { ensurePortalAccessTokenAdmin } from "@/features/interventions/server/ensurePortalAccessTokenAdmin";
export { finalizeInterventionInvoiceAdmin } from "@/features/interventions/server/finalizeInterventionInvoiceAdmin";
export { issueInterventionInvoiceAdmin } from "@/features/interventions/server/issueInterventionInvoiceAdmin";
export { notifyPortalAccessAdmin } from "@/features/interventions/server/portalAccessNotifyAdmin";
export { verifyPortalAccessAdmin } from "@/features/interventions/server/portalAccessVerifyAdmin";
export {
  isValidPortalAccessToken,
  findInterventionByPortalToken,
} from "@/features/interventions/server/portalLookupAdmin";
export { notifyTechnicianAssignmentAdmin } from "@/features/interventions/server/notifyTechnicianAssignmentAdmin";
export { prepareDraftBillingOnIntervention } from "@/features/interventions/server/prepareDraftBillingOnIntervention";
export { rejectInterventionReportServer } from "@/features/interventions/server/rejectInterventionReportServer";
export { requestInterventionInvoiceReviewAdmin } from "@/features/interventions/server/requestInterventionInvoiceReviewAdmin";
export { sendInterventionInvoiceEmailToClient } from "@/features/interventions/server/interventionInvoiceEmail";
export { technicianAmendInvoicedReportAdmin } from "@/features/interventions/server/technicianAmendInvoicedReportAdmin";
export { validateInterventionReportServer } from "@/features/interventions/server/validateInterventionReportServer";
export { sendPortalStatusUpdateEmailAdmin } from "@/features/interventions/server/portalStatusUpdateEmailAdmin";
export { coerceAdminExtraPatch } from "@/features/interventions/workflow/coerceAdminExtraPatch";
export { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
