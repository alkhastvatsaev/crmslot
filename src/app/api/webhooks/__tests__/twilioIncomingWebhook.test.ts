/** @jest-environment node */

jest.mock("@/core/api/twilioWebhook", () => ({
  readTwilioWebhookParams: jest.fn(async () => ({ CallSid: "CA123" })),
  validateTwilioWebhookRequest: jest.fn(() => true),
}));

describe("POST /api/webhooks/twilio/incoming", () => {
  it("returns TwiML voice response when signature is valid", async () => {
    const { POST } = await import("../twilio/incoming/route");
    const res = await POST(
      new Request("http://localhost/api/webhooks/twilio/incoming", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "CallSid=CA123",
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/xml");
    const xml = await res.text();
    expect(xml).toContain("<Response>");
    expect(xml).toContain("<Record");
    expect(xml).toContain("Serrurier Express Belgique");
  });

  it("returns 403 when Twilio signature is invalid", async () => {
    jest.resetModules();
    jest.doMock("@/core/api/twilioWebhook", () => ({
      readTwilioWebhookParams: jest.fn(async () => ({ CallSid: "CA123" })),
      validateTwilioWebhookRequest: jest.fn(() => false),
    }));

    const { POST } = await import("../twilio/incoming/route");
    const res = await POST(
      new Request("http://localhost/api/webhooks/twilio/incoming", {
        method: "POST",
        body: "CallSid=CA123",
      })
    );

    expect(res.status).toBe(403);
  });
});
