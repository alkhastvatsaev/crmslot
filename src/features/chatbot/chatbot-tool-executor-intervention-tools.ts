import { invalidateInterventionCache } from "@/features/chatbot/chatbot-intervention-source";
import {
  listVehicleStock,
  addVehicleStockItem,
  updateVehicleStockItem,
} from "@/features/chatbot/chatbot-executor-queries";
import {
  updateInterventionBilling,
  patchInterventionBilling,
  appendInterventionBillingLines,
  focusInterventionDocument,
} from "@/features/chatbot/chatbot-executor-billing";
import {
  updateInterventionStatus,
  assignTechnician,
  updateSchedule,
  addTimelineComment,
  saveClientEmailFromChatbot,
  sendInterventionEmailFromChatbot,
} from "@/features/chatbot/chatbot-executor-interventions";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor-context";

export async function tryExecuteChatbotInterventionTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ChatbotToolContext
): Promise<unknown | null> {
  switch (name) {
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
    case "focus_intervention_document":
      return focusInterventionDocument(ctx, input);
    case "update_intervention_billing":
      return updateInterventionBilling(ctx, input);
    case "patch_intervention_billing":
      return patchInterventionBilling(ctx, input);
    case "append_intervention_billing_lines":
      return appendInterventionBillingLines(ctx, input);
    default:
      return null;
  }
}
