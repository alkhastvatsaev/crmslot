import type { BillingPaymentFilter } from "@/features/billingHub/billingHubMetrics";
import { interventionBillingTotalCents } from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions/types";

export function filterBillingByPayment(
  rows: Intervention[],
  filter: BillingPaymentFilter,
): Intervention[] {
  switch (filter) {
    case "unpaid":
      return rows.filter(
        (iv) =>
          (iv.billingLines?.length ?? 0) > 0 &&
          (iv.paymentStatus === "unpaid" || !iv.paymentStatus),
      );
    case "pending":
      return rows.filter((iv) => iv.paymentStatus === "pending");
    case "paid":
      return rows.filter((iv) => iv.paymentStatus === "paid");
    case "to_bill":
      return rows.filter((iv) => (iv.billingLines?.length ?? 0) === 0);
    default:
      return rows;
  }
}

export function filterBillingBySearch(rows: Intervention[], query: string): Intervention[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((iv) => {
    const hay = `${iv.clientName ?? ""} ${iv.address ?? ""} ${iv.id} ${iv.reference ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export function sortBillingRows(rows: Intervention[]): Intervention[] {
  return [...rows].sort((a, b) => {
    const unpaidA = a.paymentStatus !== "paid" ? 1 : 0;
    const unpaidB = b.paymentStatus !== "paid" ? 1 : 0;
    if (unpaidB !== unpaidA) return unpaidB - unpaidA;
    return interventionBillingTotalCents(b) - interventionBillingTotalCents(a);
  });
}

export function applyBillingListFilters(
  rows: Intervention[],
  opts: { filter: BillingPaymentFilter; search: string },
): Intervention[] {
  let list = filterBillingByPayment(rows, opts.filter);
  list = filterBillingBySearch(list, opts.search);
  return sortBillingRows(list);
}
