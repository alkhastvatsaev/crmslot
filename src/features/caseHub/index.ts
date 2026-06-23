/**
 * API publique caseHub — slot pager, buckets et snapshot détail dossier.
 */
export { CASE_HUB_SLOT_INDEX } from "@/features/caseHub/caseHubConstants";
export type { CaseHubBucket, CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";
export {
  bucketForIntervention,
  bucketForStatus,
  buildCaseHubKpis,
  filterCaseInterventionsByBucket,
  sortCaseInterventionsByUrgency,
} from "@/features/caseHub/caseHubPatronMetrics";
export type { CaseHubKpis } from "@/features/caseHub/caseHubPatronMetrics";
export type {
  CaseHubAlert,
  CaseHubAlertTone,
  CaseHubDetailSnapshot,
  CaseHubInsight,
  CaseHubInsightTone,
} from "@/features/caseHub/caseHubInterventionDetail";
export {
  buildCaseHubAlerts,
  buildCaseHubDrawerTabBadges,
  canCaseHubAssignTechnician,
  buildCaseHubInsights,
  buildCaseHubDetailSnapshot,
} from "@/features/caseHub/caseHubInterventionDetail";
