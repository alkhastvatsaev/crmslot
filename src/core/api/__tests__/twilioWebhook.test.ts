/** @jest-environment node */

import { validateTwilioWebhookRequest } from "@/core/api/twilioWebhook";

jest.mock("twilio", () => ({
  validateRequest: jest.fn(() => true),
  twiml: { VoiceResponse: jest.fn() },
}));

describe("validateTwilioWebhookRequest", () => {
  const prev = process.env.NODE_ENV;

  afterEach(() => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: prev });
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WEBHOOK_PUBLIC_URL;
  });

  it("allows dev when Twilio env is missing", () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "development" });
    const ok = validateTwilioWebhookRequest(
      new Request("http://localhost/api/webhooks/twilio/incoming"),
      {},
    );
    expect(ok).toBe(true);
  });

  it("denies production without signature when token is set", () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_WEBHOOK_PUBLIC_URL = "https://example.com";
    const ok = validateTwilioWebhookRequest(
      new Request("https://example.com/api/webhooks/twilio/incoming"),
      { CallSid: "CA123" },
    );
    expect(ok).toBe(false);
  });
});
