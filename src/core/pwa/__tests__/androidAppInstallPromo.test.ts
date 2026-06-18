import {
  androidInstallPromoDismissStorageKey,
  clearAndroidInstallPromoDismissed,
  dismissAndroidInstallPromo,
  isAndroidChromeBrowser,
  isAndroidInstallPromoDismissed,
  isPwaStandalone,
  readAndroidInstallPromoDismissedUntil,
  shouldSuggestAndroidAppInstall,
} from "@/core/pwa/androidAppInstallPromo";

describe("androidAppInstallPromo", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("detects Android Chrome but not Capacitor WebView", () => {
    expect(
      isAndroidChromeBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
      )
    ).toBe(true);
    expect(
      isAndroidChromeBrowser(
        "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
      )
    ).toBe(false);
    expect(isAndroidChromeBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      false
    );
  });

  it("suggests install only on Android Chrome browser", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
    expect(
      shouldSuggestAndroidAppInstall({
        userAgent: ua,
        isCapacitorNative: false,
        isPwaStandalone: false,
      })
    ).toBe(true);
    expect(
      shouldSuggestAndroidAppInstall({
        userAgent: ua,
        isCapacitorNative: true,
        isPwaStandalone: false,
      })
    ).toBe(false);
    expect(
      shouldSuggestAndroidAppInstall({
        userAgent: ua,
        isCapacitorNative: false,
        isPwaStandalone: true,
      })
    ).toBe(false);
  });

  it("persists dismiss for 7 days", () => {
    const now = 1_700_000_000_000;
    expect(isAndroidInstallPromoDismissed("demande", now)).toBe(false);
    dismissAndroidInstallPromo("demande", now);
    expect(isAndroidInstallPromoDismissed("demande", now + 1)).toBe(true);
    expect(readAndroidInstallPromoDismissedUntil("demande", now + 1)).toBeGreaterThan(now);
    expect(isAndroidInstallPromoDismissed("demande", now + 7 * 24 * 60 * 60 * 1000)).toBe(false);
    clearAndroidInstallPromoDismissed("demande");
    expect(window.localStorage.getItem(androidInstallPromoDismissStorageKey("demande"))).toBeNull();
  });
});

describe("isPwaStandalone", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns true when display-mode is standalone", () => {
    window.matchMedia = jest.fn((query: string) => ({
      matches: query.includes("standalone"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })) as typeof window.matchMedia;

    expect(isPwaStandalone()).toBe(true);
  });
});
