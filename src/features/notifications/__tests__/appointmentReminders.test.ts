import {
  findDueReminders,
  buildReminderMessage,
} from "@/features/notifications/appointmentReminders";

describe("appointmentReminders", () => {
  const baseIv = {
    id: "iv-1",
    status: "assigned" as const,
    clientName: "Jean Dupont",
    clientFirstName: "Jean",
    clientLastName: "Dupont",
    clientPhone: "+32470000000",
    address: "Rue de la Loi 1, Bruxelles",
    title: "Ouverture de porte",
    scheduledDate: "2026-05-20",
    scheduledTime: "14:00",
    assignedTechnicianUid: "tech-1",
  };

  it("detects 2h reminder window", () => {
    // Set "now" to 2 hours before scheduled time
    const now = new Date("2026-05-20T12:00:00");
    const results = findDueReminders([baseIv], now);
    expect(results).toHaveLength(1);
    expect(results[0]?.reminderType).toBe("2h");
  });

  it("detects 24h reminder window", () => {
    const now = new Date("2026-05-19T14:00:00");
    const results = findDueReminders([baseIv], now);
    expect(results).toHaveLength(1);
    expect(results[0]?.reminderType).toBe("24h");
  });

  it("detects 30min reminder window", () => {
    const now = new Date("2026-05-20T13:30:00");
    const results = findDueReminders([baseIv], now);
    expect(results).toHaveLength(1);
    expect(results[0]?.reminderType).toBe("30min");
  });

  it("skips past appointments", () => {
    const now = new Date("2026-05-20T16:00:00");
    const results = findDueReminders([baseIv], now);
    expect(results).toHaveLength(0);
  });

  it("skips non-assigned interventions", () => {
    const now = new Date("2026-05-20T12:00:00");
    const doneIv = { ...baseIv, status: "done" as const };
    const results = findDueReminders([doneIv], now);
    expect(results).toHaveLength(0);
  });

  it("skips interventions without schedule", () => {
    const now = new Date("2026-05-20T12:00:00");
    const noDateIv = { ...baseIv, scheduledDate: null, scheduledTime: null };
    const results = findDueReminders([noDateIv], now);
    expect(results).toHaveLength(0);
  });

  it("builds reminder message with correct time label", () => {
    const msg = buildReminderMessage({
      intervention: baseIv,
      minutesUntil: 120,
      reminderType: "2h",
    });
    expect(msg.subject).toContain("dans 2 heures");
    expect(msg.body).toContain("Jean Dupont");
    expect(msg.body).toContain("Rue de la Loi");
  });
});
