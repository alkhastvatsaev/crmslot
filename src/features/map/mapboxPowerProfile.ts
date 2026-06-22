import { detectMobileClient } from "@/core/config/mobileClientDetection";
import type { MapboxDeviceTier } from "@/features/map/mapboxDeviceProfile";

/** Style premium léger — tuiles vectorielles propres (mobile). */
export const MAPBOX_STYLE_MOBILE = "mapbox://styles/mapbox/streets-v12";

/** Style premium desktop — Standard sans bâtiments 3D (config basemap). */
export const MAPBOX_STYLE_DESKTOP = "mapbox://styles/mapbox/standard";

export function isMapMobilePowerSave(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  search: string = typeof window !== "undefined" ? window.location.search : ""
): boolean {
  return detectMobileClient(userAgent, search);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function resolveMapboxPixelRatio(
  isMobile: boolean,
  devicePixelRatio: number = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
  tier: MapboxDeviceTier = "standard"
): number {
  if (isMobile) {
    if (tier === "low") return 1;
    if (tier === "high") return Math.min(devicePixelRatio, 1.75);
    return Math.min(devicePixelRatio, 1.5);
  }
  return Math.min(devicePixelRatio, 2);
}

/** @deprecated alias — préférer resolveMapboxPixelRatio */
export function resolveMapboxMobilePixelRatio(
  devicePixelRatio: number = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
): number {
  return resolveMapboxPixelRatio(true, devicePixelRatio);
}

export type MapboxInitPowerOptions = {
  style: string;
  antialias: boolean;
  fadeDuration: number;
  refreshExpiredTiles: boolean;
  maxTileCacheSize: number;
  renderWorldCopies: boolean;
  collectResourceTiming: boolean;
  respectPrefersReducedMotion: boolean;
};

export type MapboxMapRuntimeOptions = {
  failIfMajorPerformanceCaveat: boolean;
  pixelRatio: number;
};

export function isAndroidUserAgent(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  return /Android/i.test(userAgent);
}

export function resolveMapboxInitOptions(
  isMobile: boolean,
  tier: MapboxDeviceTier = "standard"
): MapboxInitPowerOptions {
  const mobileTileCache = tier === "low" ? 24 : tier === "high" ? 48 : 40;

  return {
    style: isMobile ? MAPBOX_STYLE_MOBILE : MAPBOX_STYLE_DESKTOP,
    antialias: !isMobile && tier !== "low",
    fadeDuration: prefersReducedMotion() ? 0 : isMobile ? 0 : 240,
    refreshExpiredTiles: false,
    maxTileCacheSize: isMobile ? mobileTileCache : 96,
    renderWorldCopies: false,
    collectResourceTiming: false,
    respectPrefersReducedMotion: true,
  };
}

/** Options runtime Mapbox GL — WebView Android / émulateur souvent « slow » mais utilisable. */
export function resolveMapboxMapRuntimeOptions(
  isMobile: boolean,
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  tier: MapboxDeviceTier = "standard"
): MapboxMapRuntimeOptions {
  const android = isAndroidUserAgent(userAgent);
  const allowSlowGpu = isMobile && android && tier !== "low";
  return {
    failIfMajorPerformanceCaveat: tier === "low" || !allowSlowGpu,
    pixelRatio: resolveMapboxPixelRatio(isMobile, undefined, tier),
  };
}

/** Standard : look premium en 2D (sans bâtiments 3D ni POI bruyants). */
export function applyMapboxPremiumBasemapConfig(map: {
  setConfigProperty: (layer: string, name: string, value: unknown) => void;
}): void {
  try {
    map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    map.setConfigProperty("basemap", "showTransitLabels", false);
    map.setConfigProperty("basemap", "showRoadLabels", true);
    map.setConfigProperty("basemap", "show3dObjects", false);
    map.setConfigProperty("basemap", "show3dLandmarks", false);
  } catch {
    /* streets-v12 et styles sans config Standard */
  }
}

export type MapCameraMotion = "marker" | "recenter" | "bounds";

export function resolveMapCameraDuration(isMobile: boolean, motion: MapCameraMotion): number {
  if (prefersReducedMotion()) return 0;
  if (isMobile) {
    return motion === "bounds" ? 0 : 420;
  }
  return motion === "bounds" ? 640 : 820;
}

/** Halo marker — premium desktop, plus léger sur mobile. */
export function markerGlowBlurClass(isMobile: boolean): string {
  return isMobile ? "blur-lg" : "blur-xl";
}

/**
 * WebGL actif : page carte visible. Démonte uniquement sur les autres pages hub.
 */
export function isMapWebGLActive(
  isMobile: boolean | null,
  dashboardPageIndex: number,
  mapCenterRailActive: boolean
): boolean {
  void isMobile;
  void mapCenterRailActive;
  return dashboardPageIndex === 0;
}
