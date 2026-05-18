export type SupplierOrderStatus = "draft" | "sent" | "confirmed" | "delivered" | "cancelled";

export interface SupplierOrderLine {
  sku: string;
  label: string;
  quantity: number;
  unitPriceCents: number;
}

export interface SupplierOrder {
  id: string;
  companyId: string;
  supplierId: string;
  supplierName: string;
  status: SupplierOrderStatus;
  lines: SupplierOrderLine[];
  totalCents: number;
  deliveryDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdByUid?: string | null;
}

export const SUPPLIER_ORDER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  confirmed: "Confirmé",
  delivered: "Livré",
  cancelled: "Annulé",
};

export function computeOrderTotal(lines: SupplierOrderLine[]): number {
  return lines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPriceCents), 0);
}
