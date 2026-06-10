import { isPhoneUserAgent } from "@/core/config/mobileClientDetection";

export type GalaxyAnimationProfile = {
  starCount: number;
  maxFps: number;
  maxDevicePixelRatio: number;
  pauseWhenHidden: boolean;
  interactive: boolean;
  baseSpeed: number;
  /** Met à jour le dégradé CSS tous les N frames (1 = chaque frame). */
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
    return {
      starCount: 120,
      maxFps: 20,
      maxDevicePixelRatio: 1,
      pauseWhenHidden: true,
      interactive: false,
      baseSpeed: 0.5,
      backgroundEveryNFrames: 8,
      ...overrides,
    };
  }

  return {
    starCount: 6000,
    maxFps: 60,
    maxDevicePixelRatio: 2,
    pauseWhenHidden: true,
    interactive: true,
    baseSpeed: 1,
    backgroundEveryNFrames: 1,
    ...overrides,
  };
}
