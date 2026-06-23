import {
  buildCaseHubAlerts,
  buildCaseHubDetailSnapshot,
  buildCaseHubDrawerTabBadges,
  buildCaseHubInsights,
  canCaseHubAssignTechnician,
} from "@/features/caseHub/caseHubInterventionDetail";
import type { Intervention } from "@/features/interventions";

const base: Intervention = {
  id: "iv-case-detail-001",
  title: "Porte bloquée",
  address: "Rue Test 12, Bruxelles",
  time: "10:00",
  status: "done",
  location: { lat: 0, lng: 0 },
  clientFirstName: "Alkhast",
  clientLastName: "Vatsaev",
  clientPhone: "+32470123456",
  clientEmail: "client@example.com",
  problem: "Serrure cassée",
  scheduledDate: "2026-06-20",
  scheduledTime: "14:00",
  invoiceAmountCents: 150_00,
  commissionAmountCents: 15_00,
  paymentStatus: "unpaid",
  assignedTechnicianUid: "tech-1",
};

describe("caseHubInterventionDetail", () => {
  it("builds a patron snapshot with billing and contacts", () => {
    const snapshot = buildCaseHubDetailSnapshot(base);

    expect(snapshot.clientName).toBe("Alkhast Vatsaev");
    expect(snapshot.shortId).toBe("IL-001");
    expect(snapshot.phone).toBe("+32470123456");
    expect(snapshot.email).toBe("client@example.com");
    expect(snapshot.billingCents).toBe(150_00);
    expect(snapshot.commissionCents).toBe(15_00);
    expect(snapshot.scheduleLabel).toBe("2026-06-20 · 14:00");
  });

  it("surfaces patron alerts for urgent unpaid dossiers", () => {
    const alerts = buildCaseHubAlerts({
      ...base,
      urgency: true,
      paymentStatus: "unpaid",
    });

    expect(alerts.some((a) => a.id === "urgency")).toBe(true);
    expect(alerts.some((a) => a.id === "unpaid")).toBe(true);
  });

  it("flags missing technician on pending dossiers", () => {
    const alerts = buildCaseHubAlerts({
      ...base,
      status: "pending",
      assignedTechnicianUid: null,
    });

    expect(alerts.some((a) => a.id === "no_technician")).toBe(true);
  });
  it("flags drawer tabs that need patron attention", () => {
    const badges = buildCaseHubDrawerTabBadges({
      ...base,
      status: "waiting_material",
      clientId: null,
    });
    expect(badges.materials).toBe(1);
    expect(badges.crm).toBe(1);
  });

  describe("insights", () => {
    const NOW = new Date("2026-06-21T12:00:00.000Z");

    it("computes net margin from billing and commission", () => {
      const insights = buildCaseHubInsights(
        {
          ...base,
          billingLines: [{ description: "Pose serrure", quantity: 1, unitPriceCents: 150_00 }],
          commissionAmountCents: 30_00,
        },
        [],
        NOW
      );
      const margin = insights.find((i) => i.id === "margin");
      expect(margin).toBeDefined();
      expect(margin?.value).toContain("120");
      expect(margin?.detail).toContain("80%");
    });

    it("flags unpaid dossiers older than 14 days as overdue", () => {
      const insights = buildCaseHubInsights(
        {
          ...base,
          status: "invoiced",
          invoicedAt: "2026-05-20T10:00:00.000Z",
          paymentStatus: "unpaid",
        },
        [],
        NOW
      );
      const unpaid = insights.find((i) => i.id === "unpaid_age");
      expect(unpaid?.tone).toBe("rose");
      expect(unpaid?.labelKey).toBe("caseHub.insight.unpaid_overdue");
    });

    it("flags stale to-assign dossiers as rose after 3 days", () => {
      const insights = buildCaseHubInsights(
        {
          ...base,
          status: "pending",
          createdAt: "2026-06-15T10:00:00.000Z",
        },
        [],
        NOW
      );
      const age = insights.find((i) => i.id === "case_age");
      expect(age?.tone).toBe("rose");
      expect(age?.labelKey).toBe("caseHub.insight.case_age_stale");
    });

    it("counts recurring client across peers", () => {
      const peers: Intervention[] = [
        { ...base, id: "iv-a", clientId: "client-42" },
        { ...base, id: "iv-b", clientId: "client-42" },
        { ...base, id: "iv-c", clientId: "client-99" },
      ];
      const insights = buildCaseHubInsights(
        { ...base, id: "iv-current", clientId: "client-42" },
        peers,
        NOW
      );
      const recurring = insights.find((i) => i.id === "recurring_client");
      expect(recurring).toBeDefined();
      expect(recurring?.value).toBe("3");
    });

    it("flags schedule overdue when scheduled in the past on open buckets", () => {
      const insights = buildCaseHubInsights(
        {
          ...base,
          status: "pending",
          scheduledDate: "2026-06-18",
          scheduledTime: "09:00",
        },
        [],
        NOW
      );
      const overdue = insights.find((i) => i.id === "schedule_overdue");
      expect(overdue?.tone).toBe("rose");
    });

    it("exposes insights through the detail snapshot", () => {
      const snapshot = buildCaseHubDetailSnapshot(
        {
          ...base,
          billingLines: [{ description: "Pose serrure", quantity: 1, unitPriceCents: 100_00 }],
          commissionAmountCents: 20_00,
        },
        [],
        NOW
      );
      expect(snapshot.insights.some((i) => i.id === "margin")).toBe(true);
    });
  });
});
