import {
  resolveDemoSupplierOrderProgress,
  type SupplierOrderProgressInput,
} from "@/features/chatbot/supplierOrderDemoProgress";
import {
  supplierOrderStatusFromDemoIndex,
  supplierOrderStatusRank,
} from "@/features/notifications/materialOrderStatusPush";
import type { SupplierOrderStatus } from "@/features/suppliers";

export type SupplierOrderProgressCandidate = {
  companyId: string;
  orderId: string;
  fromStatus: SupplierOrderStatus;
  toStatus: SupplierOrderStatus;
  clientName?: string | null;
  interventionId?: string | null;
  createdByUid?: string | null;
};

export function resolveSupplierOrderAutoAdvanceTarget(
  input: SupplierOrderProgressInput & { status: SupplierOrderStatus },
  now = Date.now()
): SupplierOrderStatus | null {
  const status = input.status;
  if (status === "cancelled" || status === "delivered") return null;

  const progress = resolveDemoSupplierOrderProgress({ ...input, now });
  if (progress.cancelled) return null;

  const target = supplierOrderStatusFromDemoIndex(progress.activeIndex);
  if (supplierOrderStatusRank(target) <= supplierOrderStatusRank(status)) return null;
  return target;
}

export function buildSupplierOrderProgressCandidate(
  companyId: string,
  orderId: string,
  data: Record<string, unknown>,
  now = Date.now()
): SupplierOrderProgressCandidate | null {
  const status = String(data.status ?? "draft") as SupplierOrderStatus;
  const target = resolveSupplierOrderAutoAdvanceTarget(
    {
      status,
      createdAt: data.createdAt,
      sentAt: data.sentAt,
      deliveredAt: data.deliveredAt,
    },
    now
  );
  if (!target) return null;

  return {
    companyId,
    orderId,
    fromStatus: status,
    toStatus: target,
    clientName: typeof data.clientName === "string" ? data.clientName : null,
    interventionId: typeof data.interventionId === "string" ? data.interventionId : null,
    createdByUid: typeof data.createdByUid === "string" ? data.createdByUid : null,
  };
}
