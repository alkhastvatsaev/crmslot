import { resolveDemoSupplierOrderProgress } from "@/features/chatbot/supplierOrderDemoProgress";
import type { MaterialOrder } from "@/features/materials/types";
import type { SupplierOrderStatus } from "@/features/suppliers/types";

export type OrderTrackingProgress = {
  percent: number;
  cancelled: boolean;
};

const MATERIAL_PERCENT_BY_STATUS: Record<MaterialOrder["status"], number> = {
  pending: 25,
  ordered: 60,
  received: 100,
  cancelled: 0,
};

export function resolveSupplierOrderTrackingProgress(
  status: SupplierOrderStatus | string
): OrderTrackingProgress {
  const { percent, cancelled } = resolveDemoSupplierOrderProgress(status);
  return { percent, cancelled };
}

export function resolveMaterialOrderTrackingProgress(
  status: MaterialOrder["status"] | string
): OrderTrackingProgress {
  if (status === "cancelled") {
    return { percent: 0, cancelled: true };
  }
  const key = status as MaterialOrder["status"];
  return {
    percent: MATERIAL_PERCENT_BY_STATUS[key] ?? 25,
    cancelled: false,
  };
}
