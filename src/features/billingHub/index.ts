/**
 * API publique billingHub — slot pager, métriques et agent IA facturation.
 */
export { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
export {
  computeBillingHubMetrics,
  interventionBillingTotalCents,
  formatEurFromCents,
} from "@/features/billingHub/billingHubMetrics";
export type {
  BillingPaymentFilter,
  BillingHubMetrics,
} from "@/features/billingHub/billingHubMetrics";
export {
  filterBillingByPayment,
  sortBillingRows,
  applyBillingListFilters,
} from "@/features/billingHub/filterBillingHub";
export { useCompanyBillingInterventions } from "@/features/billingHub/hooks/useCompanyBillingInterventions";
export {
  handleBillingHubAgentPost,
  BILLING_HUB_AGENT_TOOL_SCOPE,
} from "@/features/billingHub/billingHubAgentRouteHandler";
export type {
  BillingHubAgentPostBody,
  BillingHubAgentRouteAuth,
} from "@/features/billingHub/billingHubAgentRouteHandler";
