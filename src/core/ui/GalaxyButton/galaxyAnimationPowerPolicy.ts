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

/** Téléphone / touch-first — détection client (tests / usages futurs). */
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

export function resolveGalaxyAnimationProfile(
  overrides: Partial<GalaxyAnimationProfile> & {
    mobilePowerSave?: boolean;
    /** Désactive le profil économie sur téléphone (debug uniquement). */
    preferFullQuality?: boolean;
  } = {}
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

  if (overrides.mobilePowerSave === true) {
    return {
      starCount: 56,
      maxFps: 15,
      maxDevicePixelRatio: 1,
      pauseWhenHidden: true,
      interactive: false,
      baseSpeed: 0.45,
      backgroundEveryNFrames: 12,
      ...overrides,
    };
  }

  const onMobile = isMobilePowerSaveClient();
  if (onMobile && overrides.preferFullQuality !== true) {
    /** Téléphone : dégradé CSS statique — pas de boucle canvas 60 fps. */
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

  return { ...defaultProfile(GALAXY_STAR_COUNT), ...overrides };
}
