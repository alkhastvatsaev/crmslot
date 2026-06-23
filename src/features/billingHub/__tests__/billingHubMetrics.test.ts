import {
  computeBillingHubMetrics,
  interventionBillingTotalCents,
} from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions";

function iv(partial: Partial<Intervention> & { id: string }): Intervention {
  return {
    status: "done",
    clientName: "Client",
    ...partial,
  } as Intervention;
}

describe("interventionBillingTotalCents", () => {
  it("prefers invoiceAmountCents when set", () => {
    expect(
      interventionBillingTotalCents(
        iv({
          id: "a",
          invoiceAmountCents: 12_500,
          billingLines: [{ description: "", quantity: 1, unitPriceCents: 1 }],
        })
      )
    ).toBe(12_500);
  });

  it("sums billing lines otherwise", () => {
    expect(
      interventionBillingTotalCents(
        iv({
          id: "b",
          billingLines: [
            { description: "", quantity: 2, unitPriceCents: 1000 },
            { description: "", quantity: 1, unitPriceCents: 500 },
          ],
        })
      )
    ).toBe(2500);
  });
});

describe("computeBillingHubMetrics", () => {
  it("counts unpaid, pending, paid and to_bill", () => {
    const rows = [
      iv({
        id: "1",
        paymentStatus: "unpaid",
        billingLines: [{ description: "", quantity: 1, unitPriceCents: 1000 }],
      }),
      iv({
        id: "2",
        paymentStatus: "pending",
        billingLines: [{ description: "", quantity: 1, unitPriceCents: 2000 }],
      }),
      iv({
        id: "3",
        paymentStatus: "paid",
        billingLines: [{ description: "", quantity: 1, unitPriceCents: 3000 }],
      }),
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
