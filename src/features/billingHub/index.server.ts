/**
 * API serveur billingHub — handler route agent IA (routes API uniquement).
 */
export {
  handleBillingHubAgentPost,
  BILLING_HUB_AGENT_TOOL_SCOPE,
} from "@/features/billingHub/billingHubAgentRouteHandler";
export type {
  BillingHubAgentPostBody,
  BillingHubAgentRouteAuth,
} from "@/features/billingHub/billingHubAgentRouteHandler";
