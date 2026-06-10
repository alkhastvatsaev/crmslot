import { detectMobileClient } from "@/core/config/mobileClientDetection";

/** Carte Mapbox — réglages basse conso sur téléphone. */
export function isMapMobilePowerSave(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  search: string = typeof window !== "undefined" ? window.location.search : ""
): boolean {
  return detectMobileClient(userAgent, search);
}

export function resolveMapboxMobilePixelRatio(
  devicePixelRatio: number = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
): number {
  return Math.min(devicePixelRatio, 1.5);
}
