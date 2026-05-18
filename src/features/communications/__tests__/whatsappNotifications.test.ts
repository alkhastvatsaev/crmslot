import {
  formatInterventionWhatsApp,
  sendWhatsAppNotification,
} from "../whatsappNotifications";

describe("formatInterventionWhatsApp", () => {
  it("formats assigned message", () => {
    const msg = formatInterventionWhatsApp({
      clientName: "Marie",
      status: "assigned",
      address: "Rue de la Loi 1",
    });
    expect(msg).toContain("Marie");
    expect(msg).toContain("Rue de la Loi 1");
    expect(msg).toContain("technicien");
  });

  it("formats en_route message", () => {
    const msg = formatInterventionWhatsApp({
      clientName: "Paul",
      status: "en_route",
      address: "Avenue Louise 5",
    });
    expect(msg).toContain("route");
    expect(msg).toContain("Avenue Louise 5");
  });

  it("handles unknown status gracefully", () => {
    const msg = formatInterventionWhatsApp({
      clientName: "Test",
      status: "unknown_status",
      address: "Some address",
    });
    expect(msg).toContain("unknown_status");
  });
});

describe("sendWhatsAppNotification", () => {
  it("returns error when Twilio credentials are not configured", async () => {
    const orig = process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_ACCOUNT_SID;

    const result = await sendWhatsAppNotification({ to: "+32499000000", body: "Test" });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/credentials/i);

    if (orig) process.env.TWILIO_ACCOUNT_SID = orig;
  });
});
