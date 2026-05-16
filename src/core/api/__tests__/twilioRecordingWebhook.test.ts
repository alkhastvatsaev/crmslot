/** @jest-environment node */

import { validateTwilioWebhookRequest } from "@/core/api/twilioWebhook";

jest.mock("twilio", () => ({
  validateRequest: jest.fn(() => true),
  twiml: { VoiceResponse: jest.fn() },
}));

describe("twilio recording webhook auth", () => {
  it("allows dev without Twilio env", () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "development" });
    delete process.env.TWILIO_AUTH_TOKEN;
    expect(
      validateTwilioWebhookRequest(
        new Request("http://localhost/api/webhooks/twilio/recording"),
        { RecordingUrl: "https://api.twilio.com/rec" },
      ),
    ).toBe(true);
  });
});
