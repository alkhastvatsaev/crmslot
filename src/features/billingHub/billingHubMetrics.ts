import type { Intervention } from "@/features/interventions";

export type BillingPaymentFilter = "all" | "unpaid" | "pending" | "paid" | "to_bill";

export function interventionBillingTotalCents(iv: Intervention): number {
  if (typeof iv.invoiceAmountCents === "number") return iv.invoiceAmountCents;
  return (iv.billingLines ?? []).reduce(
    (s, l) => s + Math.round((l.quantity ?? 1) * (l.unitPriceCents ?? 0)),
    0
  );
}

export function formatEurFromCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export type BillingHubMetrics = {
  total: number;
  unpaid: number;
  pending: number;
  paid: number;
  toBill: number;
  totalHtCents: number;
  unpaidHtCents: number;
};

export function computeBillingHubMetrics(rows: Intervention[]): BillingHubMetrics {
  let unpaid = 0;
  let pending = 0;
  let paid = 0;
  let toBill = 0;
  let totalHtCents = 0;
  let unpaidHtCents = 0;

  for (const iv of rows) {
    const hasLines = (iv.billingLines?.length ?? 0) > 0;
    const st = iv.paymentStatus ?? "unpaid";
    const cents = interventionBillingTotalCents(iv);

    if (!hasLines && st !== "paid") {
      toBill += 1;
      continue;
    }
    if (!hasLines) continue;

    totalHtCents += cents;
    if (st === "paid") paid += 1;
    else if (st === "pending") {
      pending += 1;
      unpaidHtCents += cents;
    } else if (st === "unpaid" || !st) {
      unpaid += 1;
      unpaidHtCents += cents;
    }
  }

  return {
    total: rows.length,
    unpaid,
    pending,
    paid,
    toBill,
    totalHtCents,
    unpaidHtCents,
  };
}
