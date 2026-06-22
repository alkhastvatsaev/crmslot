import { isPhoneUserAgent } from "@/core/config/mobileClientDetection";

export const GALAXY_STAR_COUNT = 6000;
/** Orbe / dock mobile — fluide mais léger (pas 6000 étoiles desktop). */
export const GALAXY_MOBILE_STAR_COUNT = 72;
export const GALAXY_MOBILE_MAX_FPS = 24;

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

/** Téléphone / touch-first — profil canvas compact. */
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
  /** iPhone PWA : fond bleu statique uniquement — le canvas 24 fps chauffe le GPU en continu. */
  return {
    starCount: 0,
    maxFps: 0,
    maxDevicePixelRatio: 1.75,
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
