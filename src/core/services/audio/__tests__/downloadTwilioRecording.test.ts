/** @jest-environment node */

import { downloadTwilioRecording } from "@/core/services/audio/downloadTwilioRecording";

describe("downloadTwilioRecording", () => {
  const prevFetch = global.fetch;

  afterEach(() => {
    global.fetch = prevFetch;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
  });

  it("throws when credentials are missing", async () => {
    await expect(downloadTwilioRecording("https://api.twilio.com/rec/RE123")).rejects.toThrow(
      /TWILIO_ACCOUNT_SID/,
    );
  });

  it("appends .wav and sends basic auth", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC_test";
    process.env.TWILIO_AUTH_TOKEN = "secret";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as typeof fetch;

    const buf = await downloadTwilioRecording("https://api.twilio.com/rec/RE123");
    expect(buf.length).toBe(3);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.twilio.com/rec/RE123.wav",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
  });
});
