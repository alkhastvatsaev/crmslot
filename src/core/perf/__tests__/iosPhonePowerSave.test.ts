import { isIosPhonePowerSave } from "@/core/perf/iosPhonePowerSave";
import { isMobileServiceWorkerAllowed } from "@/core/pwa/mobileServiceWorkerPolicy";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

describe("isIosPhonePowerSave", () => {
  it("détecte iPhone", () => {
    expect(isIosPhonePowerSave(IPHONE_UA)).toBe(true);
  });

  it("ignore Android", () => {
    expect(isIosPhonePowerSave(ANDROID_UA)).toBe(false);
  });
});

describe("isMobileServiceWorkerAllowed", () => {
  const prev = process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_MOBILE_PWA_SW;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED = prev;
  });

  it("bloque le SW sur iPhone", () => {
    expect(isMobileServiceWorkerAllowed(IPHONE_UA)).toBe(false);
  });

  it("autorise le SW sur Android", () => {
    expect(isMobileServiceWorkerAllowed(ANDROID_UA)).toBe(true);
  });
});
