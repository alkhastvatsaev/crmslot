import { searchWorkspace } from "@/features/chatbot/chatbot-workspace-search";
import { db } from "@/features/chatbot/chatbot-executor-queries";
import {
  getWorkspaceSummary,
  listInterventions,
  getInterventionDetail,
  listClients,
  getClientDetail,
  listQuotes,
  listTechnicians,
  listStockAlerts,
  statistiquesPeriode,
  getInterventionBilling,
  listPortalChat,
} from "@/features/chatbot/chatbot-executor-queries";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor-context";

export async function tryExecuteChatbotWorkspaceTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ChatbotToolContext
): Promise<unknown | null> {
  switch (name) {
    case "get_workspace_summary":
      return getWorkspaceSummary(ctx.companyId);
    case "list_interventions":
      return listInterventions(ctx.companyId, input);
    case "get_intervention_detail":
      return getInterventionDetail(ctx.companyId, String(input.interventionId || ""));
    case "search_workspace":
      return searchWorkspace(
        db(),
        ctx.companyId,
        String(input.query || input.search || ""),
        Number(input.limit) || 25
      );
    case "list_clients":
      return listClients(ctx.companyId, input);
    case "get_client_detail":
      return getClientDetail(ctx.companyId, String(input.clientId || ""));
    case "list_quotes":
      return listQuotes(ctx.companyId, input);
    case "list_technicians":
      return listTechnicians(ctx.companyId);
    case "list_stock_alerts":
      return listStockAlerts(ctx.companyId);
    case "get_intervention_billing":
      return getInterventionBilling(ctx.companyId, String(input.interventionId || ""));
    case "list_portal_chat":
      return listPortalChat(ctx.companyId, input);
    case "statistiques_periode":
      return statistiquesPeriode(ctx.companyId, input);
    default:
      return null;
  }
}
