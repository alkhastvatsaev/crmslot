import { isMobileServiceWorkerAllowed } from "@/core/pwa/mobileServiceWorkerPolicy";

describe("isMobileServiceWorkerAllowed", () => {
  const prev = process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_MOBILE_PWA_SW;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = prev;
  });

  it("refuse SW sur iPhone", () => {
    expect(
      isMobileServiceWorkerAllowed("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe(false);
  });

  it("autorise SW sur desktop", () => {
    expect(
      isMobileServiceWorkerAllowed(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      )
    ).toBe(true);
  });

  it("override via NEXT_PUBLIC_MOBILE_PWA_SW", () => {
    process.env.NEXT_PUBLIC_MOBILE_PWA_SW = "true";
    expect(
      isMobileServiceWorkerAllowed("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")
    ).toBe(true);
  });
});
