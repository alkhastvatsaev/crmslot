import { isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import { diagnoseEquipmentPhoto } from "@/features/chatbot/chatbot-vision";
import { parseVoiceJobClosure } from "@/features/chatbot/chatbot-voice-closure";
import { computeContractChurnRisks } from "@/features/clients/contractChurnRisk";
import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";
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
  listVehicleStock,
  addVehicleStockItem,
  updateVehicleStockItem,
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
  /** Commande dossier — injectée dans order_lecot_parts. */
  materialOrderInterventionId?: string | null;
  /** Clé API OpenAI — nécessaire pour les outils vision (diagnose_equipment_photo). */
  openAIApiKey?: string;
  /** Modèle OpenAI utilisé — transmis aux outils qui lancent leur propre appel. */
  openAIModelName?: string;
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
    case "list_vehicle_stock":
      return listVehicleStock(ctx.companyId, ctx.actorUid);
    case "add_vehicle_stock_item":
      return addVehicleStockItem(ctx.companyId, ctx.actorUid, {
        sku: String(input.sku || ""),
        label: String(input.label || ""),
        quantity: Math.max(0, Number(input.quantity) || 0),
        minQuantity: Math.max(0, Number(input.minQuantity) || 1),
        unitPriceCents: Math.max(0, Number(input.unitPriceCents) || 0),
      });
    case "update_vehicle_stock_item":
      return updateVehicleStockItem(ctx.companyId, ctx.actorUid, String(input.itemId || ""), {
        quantityDelta: input.quantityDelta !== undefined ? Number(input.quantityDelta) : undefined,
        quantity: input.quantity !== undefined ? Number(input.quantity) : undefined,
        label: input.label !== undefined ? String(input.label) : undefined,
        minQuantity: input.minQuantity !== undefined ? Number(input.minQuantity) : undefined,
        unitPriceCents:
          input.unitPriceCents !== undefined ? Number(input.unitPriceCents) : undefined,
      });
    case "diagnose_equipment_photo": {
      const apiKey = ctx.openAIApiKey ?? process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) return { error: "OPENAI_API_KEY manquante" };
      return diagnoseEquipmentPhoto({
        photoUrl: String(input.photoUrl ?? ""),
        description: input.description ? String(input.description) : undefined,
        apiKey,
        modelName: ctx.openAIModelName,
      });
    }
    case "parse_voice_job_closure": {
      const apiKey = ctx.openAIApiKey ?? process.env.OPENAI_API_KEY ?? "";
      if (!apiKey) return { error: "OPENAI_API_KEY manquante" };
      return parseVoiceJobClosure({
        transcription: String(input.transcription ?? ""),
        apiKey,
        modelName: ctx.openAIModelName,
      });
    }
    case "get_contract_churn_risks": {
      const firestore = db();
      const [contractsSnap, interventions] = await Promise.all([
        firestore
          .collection("companies")
          .doc(ctx.companyId)
          .collection("maintenanceContracts")
          .where("isActive", "==", true)
          .limit(100)
          .get(),
        fetchInterventionsForCompany(firestore, ctx.companyId, 500),
      ]);
      const contracts = contractsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as unknown as import("@/features/maintenance/types").MaintenanceContract[];
      const risks = computeContractChurnRisks(
        contracts,
        interventions as unknown as import("@/features/interventions/types").Intervention[]
      );
      const filter = String(input.riskLevelFilter ?? "all");
      const filtered = filter === "all" ? risks : risks.filter((r) => r.riskLevel === filter);
      return {
        total: risks.length,
        filtered: filtered.length,
        risks: filtered.slice(0, 20),
        summary: {
          at_risk: risks.filter((r) => r.riskLevel === "at_risk").length,
          watch: risks.filter((r) => r.riskLevel === "watch").length,
          safe: risks.filter((r) => r.riskLevel === "safe").length,
        },
      };
    }
    case "trigger_accounting_export":
      return { ok: true, exportType: "accounting" };
    case "trigger_payroll_export":
      return { ok: true, exportType: "payroll" };
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
