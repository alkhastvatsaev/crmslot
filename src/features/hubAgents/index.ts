/**
 * API publique hubAgents — infra agents IA par hub (panel, scopes outils).
 * UI panel → `HubAgentPanel.tsx`.
 */
export type { HubAgentMessage, HubAgentBridgeHandlers } from "@/features/hubAgents/hubAgentTypes";
export type { UseHubAgentConfig } from "@/features/hubAgents/useHubAgent";
export { useHubAgent } from "@/features/hubAgents/useHubAgent";
export type { HubAgentStreamHandlerOptions } from "@/features/hubAgents/handleHubAgentStreamEvent";
export { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
export {
  VEHICLE_STOCK_AGENT_TOOL_SCOPE,
  MATERIAL_AGENT_TOOL_SCOPE,
  CRM_HISTORY_AGENT_TOOL_SCOPE,
  BILLING_HUB_AGENT_TOOL_SCOPE,
  HUB_AGENT_IMMEDIATE_UI_TOOLS,
} from "@/features/hubAgents/hubAgentToolScopes";
export {
  emitHubAgentToolSideEffects,
  hubUiToolSuccessMessage,
} from "@/features/hubAgents/hubAgentSideEffects";
export type {
  FocusBillingCaseEvent,
  OpenCrmDossierEvent,
  FocusStockFilter,
} from "@/features/hubAgents/hubAgentSideEffects";
