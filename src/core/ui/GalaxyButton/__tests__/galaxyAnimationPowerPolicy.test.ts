import {
  isMobilePowerSaveClient,
  resolveGalaxyAnimationProfile,
} from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

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

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("utilise un profil compact premium sur téléphone", () => {
    mockMatchMedia(true);
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(72);
    expect(profile.maxFps).toBe(24);
    expect(profile.maxDevicePixelRatio).toBe(1.75);
    expect(profile.interactive).toBe(false);
  });

  it("profil mobilePowerSave explicite sur téléphone", () => {
    mockMatchMedia(true);
    const profile = resolveGalaxyAnimationProfile({ mobilePowerSave: true });
    expect(profile.starCount).toBe(72);
    expect(profile.maxFps).toBe(24);
  });

  it("utilise 6000 étoiles sur desktop", () => {
    mockMatchMedia(false);
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(6000);
    expect(profile.interactive).toBe(true);
    expect(profile.maxFps).toBe(60);
    expect(profile.maxDevicePixelRatio).toBe(2);
  });

  it("détecte iPhone comme mobile power save", () => {
    expect(isMobilePowerSaveClient("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      true
    );
  });
});
