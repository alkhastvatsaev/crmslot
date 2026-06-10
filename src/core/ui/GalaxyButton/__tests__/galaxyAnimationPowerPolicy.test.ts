import {
  isMobilePowerSaveClient,
  resolveGalaxyAnimationProfile,
} from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

describe("galaxyAnimationPowerPolicy", () => {
  it("réduit drastiquement les étoiles sur mobile", () => {
    const profile = resolveGalaxyAnimationProfile({ mobilePowerSave: true });
    expect(profile.starCount).toBeLessThanOrEqual(720);
    expect(profile.maxFps).toBeLessThanOrEqual(30);
    expect(profile.interactive).toBe(false);
  });

  it("garde le profil desktop riche", () => {
    const profile = resolveGalaxyAnimationProfile({ mobilePowerSave: false });
    expect(profile.starCount).toBe(6000);
    expect(profile.interactive).toBe(true);
  });

  it("détecte iPhone comme mobile power save", () => {
    expect(isMobilePowerSaveClient("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      true
    );
  });
});
