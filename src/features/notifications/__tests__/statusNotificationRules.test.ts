import { findApplicableRules } from "@/features/notifications/statusNotificationRules";
import { buildNotificationPayloads } from "@/features/notifications/dispatchStatusNotifications";

describe("statusNotificationRules", () => {
  it("returns email rule for assigned transition", () => {
    const rules = findApplicableRules("pending", "assigned");
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules[0]?.toStatus).toBe("assigned");
    expect(rules[0]?.channels).toContain("email");
  });

  it("returns rules for en_route from assigned", () => {
    const rules = findApplicableRules("assigned", "en_route");
    expect(rules.length).toBe(1);
    expect(rules[0]?.targets).toContain("client");
  });

  it("returns empty for non-notifiable transitions", () => {
    const rules = findApplicableRules("pending", "pending_needs_address");
    expect(rules).toHaveLength(0);
  });

  it("matches wildcard fromStatus rules", () => {
    const rules = findApplicableRules("in_progress", "cancelled");
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules[0]?.fromStatus).toBe("*");
  });
});

describe("buildNotificationPayloads", () => {
  const baseIntervention = {
    id: "iv-1",
    clientName: "Jean Dupont",
    clientFirstName: "Jean",
    clientLastName: "Dupont",
    clientPhone: "+32470000000",
    address: "Rue de la Loi 1, Bruxelles",
    title: "Ouverture de porte",
    scheduledDate: "2026-05-20",
    scheduledTime: "10:00",
  };

  it("builds email payloads for assigned", () => {
    const payloads = buildNotificationPayloads({
      fromStatus: "pending",
      toStatus: "assigned",
      intervention: baseIntervention,
      technicianName: "Mansour",
    });
    expect(payloads.length).toBeGreaterThanOrEqual(1);
    expect(payloads[0]?.channel).toBe("email");
    expect(payloads[0]?.variables.clientName).toBe("Jean Dupont");
    expect(payloads[0]?.variables.technicianName).toBe("Mansour");
  });

  it("builds multiple payloads for waiting_material (client + dispatcher)", () => {
    const payloads = buildNotificationPayloads({
      fromStatus: "in_progress",
      toStatus: "waiting_material",
      intervention: baseIntervention,
    });
    const roles = payloads.map((p) => p.recipientRole);
    expect(roles).toContain("client");
    expect(roles).toContain("dispatcher");
  });

  it("returns empty for non-notifiable transitions", () => {
    const payloads = buildNotificationPayloads({
      fromStatus: "en_route",
      toStatus: "in_progress",
      intervention: baseIntervention,
    });
    expect(payloads).toHaveLength(0);
  });
});
