import { sentryEnabled, reportClientError } from "../sentry";

jest.mock("@/core/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { logger } from "@/core/logger";

describe("sentryEnabled", () => {
  it("is false for missing or blank DSN", () => {
    expect(sentryEnabled(undefined)).toBe(false);
    expect(sentryEnabled(null)).toBe(false);
    expect(sentryEnabled("")).toBe(false);
    expect(sentryEnabled("   ")).toBe(false);
  });

  it("is true for a configured DSN", () => {
    expect(sentryEnabled("https://abc@o1.ingest.sentry.io/1")).toBe(true);
  });
});

describe("reportClientError", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    jest.clearAllMocks();
  });

  it("logs via structured logger and does not throw without DSN", () => {
    expect(() => reportClientError(new Error("boom"), { digest: "d1" })).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      "[monitoring] Unhandled error",
      expect.objectContaining({ error: "boom", digest: "d1" })
    );
  });

  it("stringifies non-Error values", () => {
    reportClientError("plain failure");
    expect(logger.error).toHaveBeenCalledWith(
      "[monitoring] Unhandled error",
      expect.objectContaining({ error: "plain failure" })
    );
  });
});
