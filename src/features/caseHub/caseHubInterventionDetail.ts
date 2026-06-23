/**
 * API publique détail dossier Case Hub — réexporte les modules colocalisés.
 * Imports externes : `@/features/caseHub/caseHubInterventionDetail` uniquement.
 */
export type {
  CaseHubAlert,
  CaseHubAlertTone,
  CaseHubDetailSnapshot,
  CaseHubInsight,
  CaseHubInsightTone,
} from "@/features/caseHub/caseHubInterventionDetailTypes";

export {
  buildCaseHubAlerts,
  buildCaseHubDrawerTabBadges,
  canCaseHubAssignTechnician,
} from "@/features/caseHub/caseHubInterventionDetailAlerts";

export { buildCaseHubInsights } from "@/features/caseHub/caseHubInterventionDetailInsights";

export { buildCaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetailSnapshot";
