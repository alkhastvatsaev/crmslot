import {
  isGmailConfigured,
  isValidRecipientEmail,
  normalizeRecipientEmail,
} from "@/core/services/email/sendInterventionEmail";

describe("sendInterventionEmail helpers", () => {
  it("normalizes email", () => {
    expect(normalizeRecipientEmail("  Client@Example.COM ")).toBe("client@example.com");
  });

  it("validates recipient format", () => {
    expect(isValidRecipientEmail("a@b.co")).toBe(true);
    expect(isValidRecipientEmail("not-an-email")).toBe(false);
  });

  it("detects gmail env configuration (SMTP or OAuth)", () => {
    const prev = {
      GMAIL_USER: process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    };
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GMAIL_REFRESH_TOKEN;
    expect(isGmailConfigured()).toBe(false);

    process.env.GMAIL_USER = "x@y.com";
    process.env.GMAIL_APP_PASSWORD = "secret";
    expect(isGmailConfigured()).toBe(true);

    delete process.env.GMAIL_APP_PASSWORD;
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "sec";
    process.env.GMAIL_REFRESH_TOKEN = "rt";
    expect(isGmailConfigured()).toBe(true);

    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
});
