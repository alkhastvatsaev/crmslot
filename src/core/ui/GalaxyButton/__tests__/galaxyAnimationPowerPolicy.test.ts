import {
  GALAXY_MOBILE_MAX_FPS,
  GALAXY_MOBILE_STAR_COUNT,
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

  it("utilise un profil compact animé sur téléphone", () => {
    mockMatchMedia(true);
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(GALAXY_MOBILE_STAR_COUNT);
    expect(profile.maxFps).toBe(GALAXY_MOBILE_MAX_FPS);
    expect(profile.interactive).toBe(false);
  });

  it("utilise 6000 étoiles sur desktop", () => {
    mockMatchMedia(false);
    const profile = resolveGalaxyAnimationProfile();
    expect(profile.starCount).toBe(6000);
    expect(profile.interactive).toBe(true);
    expect(profile.maxFps).toBe(60);
  });

  it("détecte le touch comme profil mobile", () => {
    mockMatchMedia(true);
    expect(isMobilePowerSaveClient()).toBe(true);
  });
});
