import { isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import { searchWorkspace } from "@/features/chatbot/chatbot-workspace-search";
import { invalidateInterventionCache } from "@/features/chatbot/chatbot-intervention-source";
import { logCrmFromChatbotTool } from "@/features/crmHistory/logCrmFromChatbotTool";
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
  listMaterialOrders,
  listCompanyMaterialOrders,
  listSupplierOrders,
  listInboxNotifications,
  listInterventionEmails,
  listPortalChat,
  statistiquesPeriode,
  getInterventionBilling,
} from "@/features/chatbot/chatbot-executor-queries";
import {
  updateInterventionBilling,
  patchInterventionBilling,
  appendInterventionBillingLines,
  focusInterventionDocument,
  focusBillingCaseUi,
  focusStockItemUi,
  openCrmDossierUi,
} from "@/features/chatbot/chatbot-executor-billing";
import {
  updateInterventionStatus,
  assignTechnician,
  updateSchedule,
  addTimelineComment,
  saveClientEmailFromChatbot,
  sendInterventionEmailFromChatbot,
} from "@/features/chatbot/chatbot-executor-interventions";
import {
  searchLecotProducts,
  orderLecotParts,
  approveMaterialOrders,
  listGmailInbox,
  getGmailMessage,
  suggestGmailInterventionLinks,
  sendGmailReply,
  linkGmailToInterventionHandler,
} from "@/features/chatbot/chatbot-executor-lecot";

export type ChatbotToolContext = {
  companyId: string;
  actorUid: string;
  role: "admin" | "collaborateur" | null;
  /** Dernier message utilisateur (routage PJ email). */
  lastUserText?: string | null;
  /** Agent Matériel : nom client mémorisé pour les commandes (panneau Commandes). */
  materialOrderClientName?: string | null;
  /** Agent Matériel : refuser order_lecot sans clientName. */
  requireMaterialOrderClientName?: boolean;
};

function requireConfirmed(name: string, input: Record<string, unknown>): void {
  // order_lecot_parts gère sa propre confirmation via le panel UI Lecot (chatbot-openai.ts).
  // userConfirmed=true y est injecté par le flow confirmTool, pas ici.
  if (name === "order_lecot_parts") return;
  if (!isChatbotWriteTool(name)) return;
  if (input.userConfirmed !== true) {
    throw new Error(
      "Action refusée : confirmation utilisateur requise (userConfirmed: true) avant toute modification."
    );
  }
}

export async function executeChatbotTool(
  name: string,
  rawInput: unknown,
  ctx: ChatbotToolContext
): Promise<unknown> {
  const input = (rawInput && typeof rawInput === "object" ? rawInput : {}) as Record<
    string,
    unknown
  >;
  requireConfirmed(name, input);
  const result = await executeChatbotToolImpl(name, input, ctx);
  void logCrmFromChatbotTool(name, input, result, ctx);
  return result;
}

async function executeChatbotToolImpl(
  name: string,
  input: Record<string, unknown>,
  ctx: ChatbotToolContext
): Promise<unknown> {
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
    case "list_material_orders":
      return listMaterialOrders(String(input.interventionId || ""), input);
    case "list_company_material_orders":
      return listCompanyMaterialOrders(ctx.companyId, input);
    case "approve_material_orders":
      return approveMaterialOrders(ctx, input);
    case "focus_stock_item":
      return focusStockItemUi(input);
    case "focus_billing_case":
      return focusBillingCaseUi(input);
    case "open_crm_dossier":
      return openCrmDossierUi(input);
    case "search_lecot_products":
      return searchLecotProducts(ctx.companyId, input);
    case "list_supplier_orders":
      return listSupplierOrders(ctx.companyId, input);
    case "order_lecot_parts":
      return orderLecotParts(ctx, input);
    case "list_inbox_notifications":
      return listInboxNotifications(ctx, input);
    case "list_gmail_inbox":
      return listGmailInbox(input);
    case "get_gmail_message":
      return getGmailMessage(input);
    case "suggest_gmail_intervention_links":
      return suggestGmailInterventionLinks(ctx.companyId, input);
    case "send_gmail_reply":
      return sendGmailReply(input);
    case "link_gmail_to_intervention":
      return linkGmailToInterventionHandler(ctx, input);
    case "list_intervention_emails":
      return listInterventionEmails(String(input.interventionId || ""), input);
    case "get_intervention_billing":
      return getInterventionBilling(ctx.companyId, String(input.interventionId || ""));
    case "list_portal_chat":
      return listPortalChat(ctx.companyId, input);
    case "statistiques_periode":
      return statistiquesPeriode(ctx.companyId, input);
    case "update_intervention_status": {
      const r = await updateInterventionStatus(ctx, input);
      invalidateInterventionCache(ctx.companyId);
      return r;
    }
    case "assign_technician": {
      const r = await assignTechnician(ctx, input);
      invalidateInterventionCache(ctx.companyId);
      return r;
    }
    case "update_intervention_schedule": {
      const r = await updateSchedule(ctx, input);
      invalidateInterventionCache(ctx.companyId);
      return r;
    }
    case "add_timeline_comment":
      return addTimelineComment(ctx, input);
    case "save_client_email":
      return saveClientEmailFromChatbot(ctx, input);
    case "send_intervention_email":
      return sendInterventionEmailFromChatbot(ctx, input);
    case "focus_intervention_document":
      return focusInterventionDocument(ctx, input);
    case "update_intervention_billing":
      return updateInterventionBilling(ctx, input);
    case "patch_intervention_billing":
      return patchInterventionBilling(ctx, input);
    case "append_intervention_billing_lines":
      return appendInterventionBillingLines(ctx, input);
    default:
      throw new Error(`Outil inconnu : ${name}`);
  }
}
