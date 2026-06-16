import type { SupplierOrder } from "@/features/suppliers/types";
import {
  buildSupplierOrderPreviewFromToolResult,
  type LecotOrderToolResult,
} from "@/features/chatbot/chatbot-lecot-preview";

export type ChatbotSupplierOrdersPanelPayload = {
  highlightOrderId: string;
  materialOrderId?: string | null;
  /** Aperçu immédiat (latence Firestore ou règles non déployées). */
  previewOrder?: SupplierOrder;
};

function isLecotOrderToolResult(
  result: unknown
): result is LecotOrderToolResult & { ok?: boolean } {
  if (!result || typeof result !== "object" || "error" in (result as object)) return false;
  const r = result as { ok?: boolean; supplierOrderId?: string; lines?: unknown };
  return (
    r.ok !== false && Boolean(String(r.supplierOrderId ?? "").trim()) && Array.isArray(r.lines)
  );
}

/** Ouvre le panneau commandes après `order_lecot_parts` réussi. */
export function extractSupplierOrdersPanelFromResult(
  result: unknown,
  companyId?: string
): ChatbotSupplierOrdersPanelPayload | null {
  if (!isLecotOrderToolResult(result)) return null;

  const id = String(result.supplierOrderId).trim();
  const previewOrder =
    companyId && result.lines.length > 0
      ? buildSupplierOrderPreviewFromToolResult(companyId, result)
      : undefined;

  return {
    highlightOrderId: id,
    materialOrderId: result.materialOrderId ?? null,
    previewOrder,
  };
}
