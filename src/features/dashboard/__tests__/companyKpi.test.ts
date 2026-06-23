import { computeCompanyKpi } from "@/features/dashboard/companyKpi";
import type { Intervention } from "@/features/interventions";

describe("computeCompanyKpi", () => {
  it("counts status buckets", () => {
    const kpi = computeCompanyKpi([
      {
        id: "1",
        title: "a",
        address: "x",
        time: "t",
        status: "pending",
        location: { lat: 0, lng: 0 },
      },
      {
        id: "2",
        title: "b",
        address: "x",
        time: "t",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
        invoiceAmountCents: 10000,
      },
    ] as Intervention[]);
    expect(kpi.pending).toBe(1);
    expect(kpi.invoiced).toBe(1);
    expect(kpi.revenueCents).toBe(10000);
  });
});
