import { computeTodayActivitySummary } from "@/features/backoffice/todayActivity";
import type { Intervention } from "@/features/interventions";

function iv(partial: Partial<Intervention> & Pick<Intervention, "id" | "status">): Intervention {
  return {
    title: "",
    address: "",
    time: "",
    location: { lat: 0, lng: 0 },
    createdAt: "2026-05-17T08:00:00.000Z",
    ...partial,
  } as Intervention;
}

describe("computeTodayActivitySummary", () => {
  it("sums invoiceAmountCents for invoiced today", () => {
    const now = new Date("2026-05-17T12:00:00.000Z");
    const summary = computeTodayActivitySummary(
      [
        iv({
          id: "a",
          status: "invoiced",
          invoicedAt: "2026-05-17T10:00:00.000Z",
          invoiceAmountCents: 20_000,
        }),
        iv({
          id: "b",
          status: "invoiced",
          invoicedAt: "2026-05-17T11:00:00.000Z",
          invoiceAmountCents: 15_000,
        }),
      ],
      now
    );
    expect(summary.invoicedCount).toBe(2);
    expect(summary.revenueEstimateEuros).toBe(350);
  });
});
