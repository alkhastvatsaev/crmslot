import { BM_MATERIAL_ORDER_PARAM } from "@/features/notifications/notificationConstants";

export const MATERIAL_ORDER_PUSH_TYPE = "material_order_placed";

export const MATERIAL_ORDER_STATUS_PUSH_TYPE = "material_order_status_changed";

export type MaterialOrderNotificationIntent = { kind: "order"; orderId: string } | { kind: "none" };

export function parseMaterialOrderNotificationSearchParams(
  searchParams: URLSearchParams
): MaterialOrderNotificationIntent {
  const orderId = searchParams.get(BM_MATERIAL_ORDER_PARAM)?.trim();
  if (!orderId) return { kind: "none" };
  return { kind: "order", orderId };
}

export function parseMaterialOrderNotificationData(
  data: Record<string, string | undefined>
): MaterialOrderNotificationIntent {
  const fromParam = data[BM_MATERIAL_ORDER_PARAM]?.trim();
  if (fromParam) return { kind: "order", orderId: fromParam };

  const supplierOrderId = data.supplierOrderId?.trim();
  if (supplierOrderId) return { kind: "order", orderId: supplierOrderId };

  const materialOrderId = data.materialOrderId?.trim();
  if (materialOrderId) return { kind: "order", orderId: materialOrderId };

  return { kind: "none" };
}
