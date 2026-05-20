import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
import { extractSupplierOrdersPanelFromResult } from "@/features/chatbot/chatbot-supplier-orders-side-effect";

export type ChatbotOrderToolResultShape = {
  ok?: boolean;
  supplierOrderId?: string;
  interventionId?: string | null;
  materialOrderId?: string | null;
  billingSynced?: boolean;
  lines?: unknown[];
};

/** Panneau commandes + PDF bon fournisseur + PDF dossier (matériel / facture). */
export function emitChatbotOrderRegisteredEvents(
  emit: ChatbotStreamEmit,
  companyId: string,
  result: unknown,
): void {
  const panel = extractSupplierOrdersPanelFromResult(result, companyId);
  if (panel) {
    emit({ type: "supplier_orders_panel", ...panel });
  }

  const r = result as ChatbotOrderToolResultShape;
  if (!r?.ok || !String(r.supplierOrderId ?? "").trim()) return;

  const orderId = String(r.supplierOrderId).trim();
  const interventionId = String(r.interventionId ?? "").trim();

  emit({ type: "supplier_order_pdf", companyId, orderId });

  if (interventionId) {
    emit({
      type: "document_preview",
      interventionId,
      documentType: "material_order",
    });
    if (r.billingSynced) {
      emit({
        type: "document_preview",
        interventionId,
        documentType: "invoice",
      });
    }
  }

  emit({ type: "registry_refresh" });
}
