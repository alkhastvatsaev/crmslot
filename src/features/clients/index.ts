/**
 * API publique clients — CRM contacts, libellés et lien intervention.
 */
export type { ClientRecord, SiteRecord } from "@/features/clients/types";
export { buildClientDisplayName } from "@/features/clients/clientDisplayName";
export {
  linkInterventionToClient,
  buildInterventionClientPatch,
} from "@/features/clients/linkInterventionToClient";
export type { LinkInterventionToClientParams } from "@/features/clients/linkInterventionToClient";
export { computeContractChurnRisks, CHURN_RISK_LABELS } from "@/features/clients/contractChurnRisk";
export type { ChurnRiskLevel, ContractChurnRiskResult } from "@/features/clients/contractChurnRisk";
