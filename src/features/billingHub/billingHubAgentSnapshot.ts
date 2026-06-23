import {
  interventionBillingTotalCents,
  type BillingHubMetrics,
} from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions";

export function buildBillingHubSnapshot(
  interventions: Intervention[],
  metrics: BillingHubMetrics
): string | null {
  try {
    const urgent = interventions
      .filter(
        (iv) =>
          (iv.paymentStatus === "unpaid" || !iv.paymentStatus) &&
          interventionBillingTotalCents(iv) > 0
      )
      .slice(0, 12)
      .map((iv) => ({
        id: iv.id,
        clientName: iv.clientName ?? null,
        totalCents: interventionBillingTotalCents(iv),
        paymentStatus: iv.paymentStatus ?? null,
        status: iv.status,
      }));

    return JSON.stringify({
      metrics: {
        unpaid: metrics.unpaid,
        toBill: metrics.toBill,
        paid: metrics.paid,
        pending: metrics.pending,
      },
      urgent,
    });
  } catch {
    return null;
  }
}
