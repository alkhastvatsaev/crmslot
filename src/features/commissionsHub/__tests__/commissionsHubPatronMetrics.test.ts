import {
  buildPatronCommissionKpis,
  buildPatronTechnicianRows,
  findCompanyGroupRule,
  formatRuleShort,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import type { CommissionRule } from "@/features/commissions/types";

const NOW = new Date("2026-06-15T12:00:00.000Z");

const groupRule: CommissionRule = {
  id: "r-group",
  companyId: "co-1",
  isActive: true,
  level: "group",
  targetId: "co-1",
  valueType: "percentage",
  value: 10,
  createdAt: "",
  updatedAt: "",
  createdByUid: "a",
};

describe("commissionsHubPatronMetrics", () => {
  it("sums mission and manual commissions for current month", () => {
    const kpis = buildPatronCommissionKpis({
      now: NOW,
      rules: [groupRule],
      manualEntries: [
        {
          id: "m1",
          technicianUid: "tech-a",
          amountEuros: 50,
          reason: "Bonus",
          date: "2026-06-10",
          createdByUid: "admin",
          createdAt: "",
        },
      ],
      interventions: [
        {
          id: "iv-1",
          title: "x",
          address: "a",
          time: "10",
          status: "invoiced",
          location: { lat: 0, lng: 0 },
          assignedTechnicianUid: "tech-a",
          commissionAmountCents: 2500,
          invoicedAt: "2026-06-12T10:00:00.000Z",
        },
      ],
    });

    expect(kpis.monthMissionCents).toBe(2500);
    expect(kpis.monthManualCents).toBe(5000);
    expect(kpis.monthTotalCents).toBe(7500);
    expect(kpis.activeTechnicianCount).toBe(1);
  });

  it("builds technician rows sorted by earnings", () => {
    const rows = buildPatronTechnicianRows({
      now: NOW,
      companyId: "co-1",
      rules: [groupRule],
      technicians: [
        { id: "t1", name: "Alex", initial: "A", authUid: "tech-a" },
        { id: "t2", name: "Bob", initial: "B", authUid: "tech-b" },
      ],
      manualEntries: [],
      interventions: [
        {
          id: "iv-1",
          title: "x",
          address: "a",
          time: "10",
          status: "invoiced",
          location: { lat: 0, lng: 0 },
          assignedTechnicianUid: "tech-b",
          commissionAmountCents: 9000,
          invoicedAt: "2026-06-01T10:00:00.000Z",
        },
        {
          id: "iv-2",
          title: "y",
          address: "b",
          time: "11",
          status: "invoiced",
          location: { lat: 0, lng: 0 },
          assignedTechnicianUid: "tech-a",
          commissionAmountCents: 1000,
          invoicedAt: "2026-06-02T10:00:00.000Z",
        },
      ],
    });

    expect(rows[0]?.uid).toBe("tech-b");
    expect(rows[0]?.monthEarnedCents).toBe(9000);
    expect(rows[1]?.displayRule?.id).toBe("r-group");
    expect(formatRuleShort(groupRule)).toBe("10%");
  });

  it("finds company group rule", () => {
    expect(findCompanyGroupRule([groupRule], "co-1")?.id).toBe("r-group");
    expect(findCompanyGroupRule([], "co-1")).toBeNull();
  });

  it("handles Firestore Timestamp-like invoicedAt without crashing", () => {
    const june2026 = new Date("2026-06-12T10:00:00.000Z");
    const kpis = buildPatronCommissionKpis({
      now: NOW,
      rules: [],
      manualEntries: [
        {
          id: "m-ts",
          technicianUid: "tech-a",
          amountEuros: 20,
          reason: "Bonus",
          date: { toDate: () => june2026 },
          createdByUid: "admin",
          createdAt: "",
        },
      ],
      interventions: [
        {
          id: "iv-ts",
          title: "x",
          address: "a",
          time: "10",
          status: "invoiced",
          location: { lat: 0, lng: 0 },
          assignedTechnicianUid: "tech-a",
          commissionAmountCents: 1500,
          invoicedAt: { toDate: () => june2026 } as unknown as string,
        },
      ],
    });

    expect(kpis.monthMissionCents).toBe(1500);
    expect(kpis.monthManualCents).toBe(2000);
    expect(kpis.monthTotalCents).toBe(3500);
  });
});
