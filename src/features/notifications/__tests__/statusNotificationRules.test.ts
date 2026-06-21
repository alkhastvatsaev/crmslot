import { findApplicableRules } from "@/features/notifications/statusNotificationRules";
import { buildNotificationPayloads } from "@/features/notifications/dispatchStatusNotifications";

describe("statusNotificationRules", () => {
  it("returns email rule for assigned transition (client)", () => {
    const rules = findApplicableRules("pending", "assigned");
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules.some((r) => r.targets.includes("client") && r.channels.includes("email"))).toBe(
      true
    );
  });

  it("returns at least one rule for en_route from assigned (client + dispatcher)", () => {
    const rules = findApplicableRules("assigned", "en_route");
    expect(rules.length).toBeGreaterThanOrEqual(1);
    const allTargets = rules.flatMap((r) => r.targets);
    expect(allTargets).toContain("client");
  });

  it("returns rules for pending_needs_address (dispatcher alerté)", () => {
    const rules = findApplicableRules("pending", "pending_needs_address");
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules.flatMap((r) => r.targets)).toContain("dispatcher");
  });

  it("matches wildcard fromStatus rules", () => {
    const rules = findApplicableRules("in_progress", "cancelled");
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules.some((r) => r.fromStatus === "*")).toBe(true);
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

  it("builds payloads for assigned (push + email client)", () => {
    const payloads = buildNotificationPayloads({
      fromStatus: "pending",
      toStatus: "assigned",
      intervention: baseIntervention,
      technicianName: "Mansour",
    });
    expect(payloads.length).toBeGreaterThanOrEqual(1);
    expect(payloads.some((p) => p.recipientRole === "client" && p.channel === "email")).toBe(true);
    expect(payloads[0]?.variables.clientName).toBe("Jean Dupont");
    expect(payloads[0]?.variables.technicianName).toBe("Mansour");
  });

  it("inclut recipientUid pour les pushs ciblés (client/technician)", () => {
    const payloads = buildNotificationPayloads({
      fromStatus: "pending",
      toStatus: "assigned",
      intervention: baseIntervention,
      technicianName: "Mansour",
      clientUid: "client-uid-1",
      technicianUid: "tech-uid-1",
    });
    const clientPush = payloads.find((p) => p.recipientRole === "client" && p.channel === "push");
    const techPush = payloads.find((p) => p.recipientRole === "technician" && p.channel === "push");
    expect(clientPush?.variables.recipientUid).toBe("client-uid-1");
    expect(techPush?.variables.recipientUid).toBe("tech-uid-1");
  });

  it("push dispatcher porte companyId pour broadcast côté API", () => {
    // → pending notifie le dispatcher (nouveau dossier à assigner).
    const payloads = buildNotificationPayloads({
      fromStatus: "pending_needs_address",
      toStatus: "pending",
      intervention: baseIntervention,
      companyId: "co-1",
    });
    const dispatcherPush = payloads.find(
      (p) => p.recipientRole === "dispatcher" && p.channel === "push"
    );
    expect(dispatcherPush?.variables.companyId).toBe("co-1");
    expect(dispatcherPush?.variables.recipientUid).toBeUndefined();
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
});
