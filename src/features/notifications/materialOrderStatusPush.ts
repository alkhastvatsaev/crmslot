import type { MaterialOrder } from "@/features/materials/types";
import { BM_MATERIAL_ORDER_PARAM } from "@/features/notifications/notificationConstants";
import {
  MATERIAL_ORDER_PUSH_TYPE,
  MATERIAL_ORDER_STATUS_PUSH_TYPE,
} from "@/features/notifications/materialOrderNotificationUrls";
import { SUPPLIER_ORDER_STATUS_LABELS, type SupplierOrderStatus } from "@/features/suppliers";

export const MATERIAL_ORDER_STATUS_LABELS: Record<MaterialOrder["status"], string> = {
  pending: "En attente",
  ordered: "Commandée",
  received: "Reçue",
  cancelled: "Annulée",
};

export type OrderStatusPushKind = "supplier" | "material";

export function resolveSupplierOrderStatusLabel(status: string): string {
  const key = status as SupplierOrderStatus;
  return SUPPLIER_ORDER_STATUS_LABELS[key] ?? status;
}

export function resolveMaterialOrderStatusLabel(status: string): string {
  const key = status as MaterialOrder["status"];
  return MATERIAL_ORDER_STATUS_LABELS[key] ?? status;
}

export function resolveOrderStatusPushLabel(kind: OrderStatusPushKind, status: string): string {
  return kind === "supplier"
    ? resolveSupplierOrderStatusLabel(status)
    : resolveMaterialOrderStatusLabel(status);
}

export function buildOrderStatusPushBody(
  kind: OrderStatusPushKind,
  toStatus: string,
  fromStatus?: string | null
): string {
  const toLabel = resolveOrderStatusPushLabel(kind, toStatus);
  const fromLabel = fromStatus?.trim() ? resolveOrderStatusPushLabel(kind, fromStatus.trim()) : "";
  if (fromLabel && fromLabel !== toLabel) {
    return `${fromLabel} → ${toLabel}`;
  }
  return `Étape : ${toLabel}`;
}

export function buildOrderStatusPushData(params: {
  companyId: string;
  kind: OrderStatusPushKind;
  toStatus: string;
  fromStatus?: string | null;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
  interventionId?: string | null;
}): Record<string, string> {
  const data: Record<string, string> = {
    type: MATERIAL_ORDER_STATUS_PUSH_TYPE,
    companyId: params.companyId.trim(),
    orderKind: params.kind,
    toStatus: params.toStatus,
  };
  const fromStatus = params.fromStatus?.trim();
  const supplierOrderId = params.supplierOrderId?.trim();
  const materialOrderId = params.materialOrderId?.trim();
  const interventionId = params.interventionId?.trim();
  if (fromStatus) data.fromStatus = fromStatus;
  if (supplierOrderId) data.supplierOrderId = supplierOrderId;
  if (materialOrderId) data.materialOrderId = materialOrderId;
  if (interventionId) data.interventionId = interventionId;
  const openId = supplierOrderId || materialOrderId;
  if (openId) data[BM_MATERIAL_ORDER_PARAM] = openId;
  return data;
}

export function buildMaterialOrderPlacedPushData(params: {
  companyId: string;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
  interventionId?: string | null;
}): Record<string, string> {
  const data: Record<string, string> = {
    type: MATERIAL_ORDER_PUSH_TYPE,
    companyId: params.companyId.trim(),
  };
  const supplierOrderId = params.supplierOrderId?.trim();
  const materialOrderId = params.materialOrderId?.trim();
  const interventionId = params.interventionId?.trim();
  if (supplierOrderId) data.supplierOrderId = supplierOrderId;
  if (materialOrderId) data.materialOrderId = materialOrderId;
  if (interventionId) data.interventionId = interventionId;
  const openId = supplierOrderId || materialOrderId;
  if (openId) data[BM_MATERIAL_ORDER_PARAM] = openId;
  return data;
}

const SUPPLIER_STATUS_RANK: Record<SupplierOrderStatus, number> = {
  draft: 0,
  sent: 1,
  confirmed: 2,
  delivered: 3,
  cancelled: -1,
};

export function supplierOrderStatusRank(status: string): number {
  return SUPPLIER_STATUS_RANK[status as SupplierOrderStatus] ?? 0;
}

/** Index démo (0–3) → statut Firestore cible pour avancement automatique. */
export function supplierOrderStatusFromDemoIndex(index: number): SupplierOrderStatus {
  const ranks: SupplierOrderStatus[] = ["draft", "sent", "confirmed", "delivered"];
  const clamped = Math.max(0, Math.min(ranks.length - 1, index));
  return ranks[clamped] ?? "delivered";
}
