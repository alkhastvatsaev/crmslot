import {
  buildPatronCommissionKpis,
  buildPatronMonthlySeries,
  buildPatronTechnicianRows,
  computeTechnicianCommissionPreviewCents,
  resolveTechnicianPayablePreviewCents,
  findCompanyGroupRule,
  formatRuleShort,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import type { CommissionRule } from "@/features/commissions";

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
          date: "2026-06-15",
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

  it("agrège le CA technicien par mois de clôture avec repli billingLines", () => {
    const interventions = [
      {
        id: "a",
        title: "A",
        address: "x",
        time: "10",
        status: "done",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-1",
        completedAt: "2026-04-10T10:00:00.000Z",
        billingLines: [{ description: "MO", quantity: 1, unitPriceCents: 12_000 }],
      },
      {
        id: "b",
        title: "B",
        address: "x",
        time: "10",
        status: "invoiced",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-2",
        completedAt: "2026-06-05T10:00:00.000Z",
        invoiceAmountCents: 25_000,
      },
      {
        id: "c",
        title: "C",
        address: "x",
        time: "10",
        status: "done",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-1",
        completedAt: "2026-06-12T10:00:00.000Z",
        invoiceAmountCents: 18_000,
      },
      {
        id: "d",
        title: "D",
        address: "x",
        time: "10",
        status: "pending",
        location: { lat: 0, lng: 0 },
        assignedTechnicianUid: "tech-1",
        completedAt: "2026-06-12T10:00:00.000Z",
        invoiceAmountCents: 99_000,
      },
    ];

    const series = buildPatronMonthlySeries({
      interventions,
      manualEntries: [],
      now: NOW,
      months: 6,
    });
    expect(series.find((p) => p.monthKey === "2026-04")?.revenueCents).toBe(12_000);
    expect(series.find((p) => p.monthKey === "2026-06")?.revenueCents).toBe(43_000);

    const kpis = buildPatronCommissionKpis({
      interventions,
      manualEntries: [],
      rules: [],
      now: NOW,
    });
    expect(kpis.monthRevenueCents).toBe(43_000);
  });
  it("calcule la commission prévue à partir du CA et du taux", () => {
    expect(
      computeTechnicianCommissionPreviewCents({
        revenueCents: 120_000,
        revenueMissionCount: 3,
        valueType: "percentage",
        value: 10,
      })
    ).toBe(12_000);

    expect(
      computeTechnicianCommissionPreviewCents({
        revenueCents: 120_000,
        revenueMissionCount: 2,
        valueType: "fixed_amount",
        value: 25,
      })
    ).toBe(5_000);
  });

  it("agrège le CA mensuel par technicien", () => {
    const rows = buildPatronTechnicianRows({
      now: NOW,
      companyId: "co-1",
      rules: [groupRule],
      technicians: [{ id: "t1", name: "Alex", initial: "A", authUid: "tech-a" }],
      manualEntries: [],
      interventions: [
        {
          id: "iv-rev",
          title: "x",
          address: "a",
          time: "10",
          status: "done",
          location: { lat: 0, lng: 0 },
          assignedTechnicianUid: "tech-a",
          completedAt: "2026-06-12T10:00:00.000Z",
          invoiceAmountCents: 120_000,
        },
      ],
    });

    expect(rows[0]?.monthRevenueCents).toBe(120_000);
    expect(rows[0]?.revenueMissionCount).toBe(1);
    expect(
      computeTechnicianCommissionPreviewCents({
        revenueCents: rows[0]!.monthRevenueCents,
        revenueMissionCount: rows[0]!.revenueMissionCount,
        valueType: "percentage",
        value: 10,
      })
    ).toBe(12_000);
  });

  it("additionne bonus manuels au montant calculé", () => {
    const rows = buildPatronTechnicianRows({
      now: NOW,
      companyId: "co-1",
      rules: [groupRule],
      technicians: [{ id: "t1", name: "Alex", initial: "A", authUid: "tech-a" }],
      manualEntries: [
        {
          id: "m1",
          technicianUid: "tech-a",
          amountEuros: 20,
          reason: "Bonus",
          date: "2026-06-10",
          createdByUid: "admin",
          createdAt: "",
        },
      ],
      interventions: [
        {
          id: "iv-rev",
          title: "x",
          address: "a",
          time: "10",
          status: "done",
          location: { lat: 0, lng: 0 },
          assignedTechnicianUid: "tech-a",
          completedAt: "2026-06-12T10:00:00.000Z",
          invoiceAmountCents: 120_000,
        },
      ],
    });

    expect(resolveTechnicianPayablePreviewCents(rows[0]!)).toBe(14_000);
  });
});
