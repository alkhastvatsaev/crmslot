import {
  isMobilePowerSaveClient,
  resolveGalaxyAnimationProfile,
} from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
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

  it("active le profil animé léger si mobilePowerSave est explicite", () => {
    const profile = resolveGalaxyAnimationProfile({ mobilePowerSave: true });
    expect(profile.starCount).toBe(56);
    expect(profile.maxFps).toBe(15);
    expect(profile.interactive).toBe(false);
  });

  it("utilise 6000 étoiles sur desktop", () => {
    mockMatchMedia(false);
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(6000);
    expect(profile.interactive).toBe(true);
    expect(profile.maxFps).toBe(60);
    expect(profile.maxDevicePixelRatio).toBe(2);
  });

  it("utilise un fond statique sur téléphone (pas de canvas 60 fps)", () => {
    mockMatchMedia(true);
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(0);
    expect(profile.maxFps).toBe(0);
    expect(profile.interactive).toBe(false);
  });

  it("détecte iPhone comme mobile power save", () => {
    expect(isMobilePowerSaveClient("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      true
    );
  });
});
