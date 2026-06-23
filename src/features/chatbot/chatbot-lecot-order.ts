import { computeOrderTotal } from "@/features/suppliers/types";
import {
  executeDemoLecotOrder,
  isLecotDemoMode,
} from "@/features/chatbot/chatbot-lecot-order-demo";
import {
  createSupplierOrderDraft,
  resolveLecotOrderClientName,
} from "@/features/chatbot/chatbot-lecot-order-helpers";
import {
  enrichLecotOrderLinesWithCatalogPrices,
  parseOrderLines,
} from "@/features/chatbot/chatbot-lecot-order-lines";
import { executeProductionLecotOrder } from "@/features/chatbot/chatbot-lecot-order-prod";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

export async function orderLecotPartsForChatbot(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const parsed = parseOrderLines(input.lines);
  const lines = await enrichLecotOrderLinesWithCatalogPrices(ctx.companyId, parsed);
  const notes = typeof input.notes === "string" && input.notes.trim() ? input.notes.trim() : null;
  const interventionId =
    typeof input.interventionId === "string" ? input.interventionId.trim() : "";
  const linkMaterialOrder = input.linkMaterialOrder !== false;

  const orderClientName = await resolveLecotOrderClientName(ctx, input, interventionId);
  const totalCents = computeOrderTotal(lines);

  const { firestore, orderRef } = await createSupplierOrderDraft({
    companyId: ctx.companyId,
    actorUid: ctx.actorUid,
    lines,
    totalCents,
    notes,
    interventionId,
    orderClientName,
  });

  const shared = {
    ctx,
    input,
    orderRef,
    firestore,
    lines,
    totalCents,
    notes,
    interventionId,
    linkMaterialOrder,
    orderClientName,
  };

  if (isLecotDemoMode()) {
    return executeDemoLecotOrder(shared);
  }
  return executeProductionLecotOrder(shared);
}

export { listSupplierOrdersForChatbot } from "@/features/chatbot/chatbot-lecot-order-list";
