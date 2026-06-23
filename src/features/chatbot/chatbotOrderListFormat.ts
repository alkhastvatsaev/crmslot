import type { SupplierOrder } from "@/features/suppliers/types";

export function isOpenSupplierOrder(order: SupplierOrder): boolean {
  return order.status === "draft" || order.status === "sent" || order.status === "confirmed";
}

export function formatWhenShort(raw: unknown): string {
  if (!raw) return "";
  let ms = 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    ms = (raw as { seconds: number }).seconds * 1000;
  } else {
    const t = Date.parse(String(raw));
    if (!Number.isFinite(t)) return "";
    ms = t;
  }
  return new Date(ms).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}
