import { isPhoneUserAgent } from "@/core/config/mobileClientDetection";

export const GALAXY_STAR_COUNT = 6000;

export type GalaxyAnimationProfile = {
  starCount: number;
  maxFps: number;
  maxDevicePixelRatio: number;
  pauseWhenHidden: boolean;
  interactive: boolean;
  baseSpeed: number;
  backgroundEveryNFrames: number;
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasMatchMedia(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
}

/** Téléphone / touch-first — profil basse consommation. */
export function isMobilePowerSaveClient(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  if (hasMatchMedia("(pointer: coarse)")) return true;
  if (hasMatchMedia("(max-width: 768px)")) return true;
  return isPhoneUserAgent(userAgent);
}

function defaultProfile(starCount: number): GalaxyAnimationProfile {
  return {
    starCount,
    maxFps: 60,
    maxDevicePixelRatio: 2,
    pauseWhenHidden: true,
    interactive: true,
    baseSpeed: 1,
    backgroundEveryNFrames: 1,
  };
}

function mobileProfile(overrides: Partial<GalaxyAnimationProfile>): GalaxyAnimationProfile {
  return {
    /** PWA mobile : fond CSS statique uniquement — zéro boucle canvas (surchauffe batterie). */
    starCount: 0,
    maxFps: 0,
    maxDevicePixelRatio: 1.5,
    pauseWhenHidden: true,
    interactive: false,
    baseSpeed: 0,
    backgroundEveryNFrames: 1,
    ...overrides,
  };
}

export function resolveGalaxyAnimationProfile(
  overrides: Partial<GalaxyAnimationProfile> & { mobilePowerSave?: boolean } = {}
): GalaxyAnimationProfile {
  if (prefersReducedMotion()) {
    return {
      starCount: 0,
      maxFps: 0,
      maxDevicePixelRatio: 1,
      pauseWhenHidden: true,
      interactive: false,
      baseSpeed: 0,
      backgroundEveryNFrames: 1,
      ...overrides,
    };
  }

  const mobile =
    overrides.mobilePowerSave === true
      ? true
      : overrides.mobilePowerSave === false
        ? false
        : isMobilePowerSaveClient();

  if (mobile) {
    return mobileProfile(overrides);
  }

  return { ...defaultProfile(GALAXY_STAR_COUNT), ...overrides };
}
