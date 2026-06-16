import type {
  SupplierOrder,
  SupplierOrderLine,
  SupplierOrderStatus,
} from "@/features/suppliers/types";

export type LecotOrderToolResult = {
  supplierOrderId: string;
  clientName?: string | null;
  interventionId?: string | null;
  materialOrderId?: string | null;
  status?: SupplierOrderStatus;
  totalCents: number;
  lines: Array<{
    sku: string;
    label: string;
    quantity: number;
    unitPriceCents?: number;
    unitPriceEur?: number;
  }>;
  previewReference?: string;
  isPreview?: boolean;
};

export function buildLecotPreviewReference(orderId: string): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `PREVIEW-LECOT-${stamp}-${orderId.slice(0, 6).toUpperCase()}`;
}

/** Aperçu panneau droit — affiché avant sync Firestore (ou si règles / index en échec). */
export function buildSupplierOrderPreviewFromToolResult(
  companyId: string,
  result: LecotOrderToolResult
): SupplierOrder {
  const now = new Date().toISOString();
  const lines: SupplierOrderLine[] = (result.lines ?? []).map((l) => {
    let unitPriceCents = Math.round(Number(l.unitPriceCents) || 0);
    if (!unitPriceCents && typeof l.unitPriceEur === "number") {
      unitPriceCents = Math.round(l.unitPriceEur * 100);
    }
    return {
      sku: l.sku,
      label: l.label,
      quantity: l.quantity,
      unitPriceCents: Math.max(0, unitPriceCents),
    };
  });

  const status: SupplierOrderStatus =
    result.status === "sent" ||
    result.status === "draft" ||
    result.status === "confirmed" ||
    result.status === "delivered" ||
    result.status === "cancelled"
      ? result.status
      : "draft";

  const notes = result.isPreview
    ? `Aperçu commande — ${result.previewReference ?? result.supplierOrderId}. Compte Lecot pro non connecté ; aucun envoi réel.`
    : null;

  return {
    id: result.supplierOrderId,
    companyId,
    supplierId: "lecot",
    supplierName: "Lecot",
    status,
    lines,
    totalCents: result.totalCents,
    notes,
    createdAt: now,
    updatedAt: now,
    sentAt: status === "sent" ? now : null,
    isDemo: Boolean(result.isPreview),
    interventionId: result.interventionId?.trim() || undefined,
    clientName: result.clientName?.trim() || undefined,
  };
}
