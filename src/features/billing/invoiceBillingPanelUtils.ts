import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import type { PaymentStatus } from "@/features/billing/invoiceBillingPanelTypes";

export const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  unpaid: "bg-red-100 text-red-600",
  refunded: "bg-slate-100 text-slate-500",
};

export function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function formatBillingDate(val: unknown): string {
  const d = coerceFirestoreLikeDate(val);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

export function billingLinesTotalCents(
  lines: NonNullable<import("@/features/interventions/types").Intervention["billingLines"]>
): number {
  return lines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPriceCents), 0);
}

export function paymentStatusLabel(t: (key: string) => unknown, status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    paid: String(t("billing.status_paid")),
    pending: String(t("billing.status_pending")),
    unpaid: String(t("billing.status_unpaid")),
    refunded: String(t("billing.status_refunded")),
  };
  return labels[status];
}
