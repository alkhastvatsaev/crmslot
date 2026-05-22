import {
  computeBillingHubMetrics,
  interventionBillingTotalCents,
} from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> & { id: string }): Intervention {
  return {
    id: partial.id,
    status: partial.status ?? "done",
    clientName: partial.clientName ?? "Client",
    ...partial,
  } as Intervention;
}

describe("interventionBillingTotalCents", () => {
  it("prefers invoiceAmountCents when set", () => {
    expect(
      interventionBillingTotalCents(
        iv({ id: "a", invoiceAmountCents: 12_500, billingLines: [{ quantity: 1, unitPriceCents: 1 }] }),
      ),
    ).toBe(12_500);
  });

  it("sums billing lines otherwise", () => {
    expect(
      interventionBillingTotalCents(
        iv({
          id: "b",
          billingLines: [
            { quantity: 2, unitPriceCents: 1000 },
            { quantity: 1, unitPriceCents: 500 },
          ],
        }),
      ),
    ).toBe(2500);
  });
});

describe("computeBillingHubMetrics", () => {
  it("counts unpaid, pending, paid and to_bill", () => {
    const rows = [
      iv({ id: "1", paymentStatus: "unpaid", billingLines: [{ quantity: 1, unitPriceCents: 1000 }] }),
      iv({ id: "2", paymentStatus: "pending", billingLines: [{ quantity: 1, unitPriceCents: 2000 }] }),
      iv({ id: "3", paymentStatus: "paid", billingLines: [{ quantity: 1, unitPriceCents: 3000 }] }),
      iv({ id: "4", paymentStatus: "unpaid", billingLines: [] }),
    ];
    const m = computeBillingHubMetrics(rows);
    expect(m.unpaid).toBe(1);
    expect(m.pending).toBe(1);
    expect(m.paid).toBe(1);
    expect(m.toBill).toBe(1);
    expect(m.totalHtCents).toBe(6000);
    expect(m.unpaidHtCents).toBe(3000);
  });
});
