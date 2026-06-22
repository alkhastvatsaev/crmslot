import { isMobileServiceWorkerAllowed } from "@/core/pwa/mobileServiceWorkerPolicy";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

describe("isMobileServiceWorkerAllowed", () => {
  const prev = process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = prev;
  });

  it("autorise le SW sur iPhone (mode premium)", () => {
    expect(isMobileServiceWorkerAllowed(IPHONE_UA)).toBe(true);
  });

  it("refuse le SW si désactivé par env", () => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = "false";
    expect(isMobileServiceWorkerAllowed(IPHONE_UA)).toBe(false);
  });
});
