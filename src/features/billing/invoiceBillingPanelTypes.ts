import type { Intervention } from "@/features/interventions/types";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export type InvoiceBillingPanelProps = {
  intervention: Intervention;
  onApplyTemplate?: (amountEuros: number) => void;
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "pending", "paid", "refunded"];
