import {
  GALAXY_MOBILE_MAX_FPS,
  GALAXY_MOBILE_STAR_COUNT,
  isCompactTouchClient,
  isMobilePowerSaveClient,
  resolveGalaxyAnimationProfile,
} from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? false : matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe("galaxyAnimationPowerPolicy", () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(global, "navigator", {
      writable: true,
      configurable: true,
      value: originalNavigator,
    });
  });

  it("utilise un profil compact (étoiles réduites) sur touch Android", () => {
    mockMatchMedia(true);
    Object.defineProperty(global, "navigator", {
      writable: true,
      configurable: true,
      value: { userAgent: ANDROID_UA },
    });
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(GALAXY_MOBILE_STAR_COUNT);
    expect(profile.maxFps).toBe(GALAXY_MOBILE_MAX_FPS);
    expect(profile.maxDevicePixelRatio).toBe(1.75);
    expect(profile.interactive).toBe(false);
  });

  it("canvas statique sur iPhone (0 fps)", () => {
    mockMatchMedia(false);
    Object.defineProperty(global, "navigator", {
      writable: true,
      configurable: true,
      value: { userAgent: IPHONE_UA },
    });
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(0);
    expect(profile.maxFps).toBe(0);
  });

  it("profil mobilePowerSave explicite force 0 fps", () => {
    mockMatchMedia(true);
    const profile = resolveGalaxyAnimationProfile({ mobilePowerSave: true });
    expect(profile.starCount).toBe(0);
    expect(profile.maxFps).toBe(0);
  });

  it("utilise 6000 étoiles sur desktop", () => {
    mockMatchMedia(false);
    Object.defineProperty(global, "navigator", {
      writable: true,
      configurable: true,
      value: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)" },
    });
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(6000);
    expect(profile.interactive).toBe(true);
    expect(profile.maxFps).toBe(60);
    expect(profile.maxDevicePixelRatio).toBe(2);
  });

  it("détecte iPhone comme mobile power save", () => {
    expect(isMobilePowerSaveClient(IPHONE_UA)).toBe(true);
    expect(isMobilePowerSaveClient(ANDROID_UA)).toBe(false);
  });

  it("détecte touch compact sans iPhone", () => {
    mockMatchMedia(true);
    expect(isCompactTouchClient(ANDROID_UA)).toBe(true);
    expect(isMobilePowerSaveClient(ANDROID_UA)).toBe(false);
  });
});
