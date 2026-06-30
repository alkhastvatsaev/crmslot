import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { OrderStatusPushKind } from "@/features/notifications/materialOrderStatusPush";

export type DispatchOrderStatusPushParams = {
  companyId: string;
  kind: OrderStatusPushKind;
  fromStatus?: string | null;
  toStatus: string;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
  interventionId?: string | null;
  clientName?: string | null;
};

/** Fire-and-forget — notif push après changement de statut commande (client Firestore). */
export function dispatchOrderStatusPushClient(params: DispatchOrderStatusPushParams): void {
  const companyId = params.companyId.trim();
  const toStatus = params.toStatus.trim();
  if (!companyId || !toStatus) return;
  if (params.fromStatus?.trim() === toStatus) return;

  void fetchWithAuth("/api/notifications/order-status-changed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId,
      kind: params.kind,
      fromStatus: params.fromStatus ?? null,
      toStatus,
      supplierOrderId: params.supplierOrderId ?? null,
      materialOrderId: params.materialOrderId ?? null,
      interventionId: params.interventionId ?? null,
      clientName: params.clientName ?? null,
    }),
  }).catch(() => {});
}
