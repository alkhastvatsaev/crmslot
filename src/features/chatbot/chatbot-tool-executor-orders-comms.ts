import {
  listMaterialOrders,
  listCompanyMaterialOrders,
  listSupplierOrders,
  listInboxNotifications,
  listInterventionEmails,
} from "@/features/chatbot/chatbot-executor-queries";
import {
  focusBillingCaseUi,
  focusStockItemUi,
  openCrmDossierUi,
} from "@/features/chatbot/chatbot-executor-billing";
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
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor-context";

export async function tryExecuteChatbotOrdersCommsTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ChatbotToolContext
): Promise<unknown | null> {
  switch (name) {
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
    default:
      return null;
  }
}
