import { getCapacitorPlatform, isCapacitorNative } from "@/core/native/capacitorRuntime";
import { isAndroidUserAgent } from "@/features/map/mapboxPowerProfile";

export const MAPBOX_STYLE_SLUG_MOBILE = "mapbox/streets-v12";
export const MAPBOX_STYLE_SLUG_DESKTOP = "mapbox/standard";

/** WebView Android ne résout pas toujours `mapbox://` — HTTPS obligatoire pour les tuiles. */
export function needsHttpsMapboxStyleUrl(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  if (isCapacitorNative() && getCapacitorPlatform() === "android") return true;
  return isAndroidUserAgent(userAgent);
}

export function resolveMapboxStyleSlug(isMobile: boolean): string {
  return isMobile ? MAPBOX_STYLE_SLUG_MOBILE : MAPBOX_STYLE_SLUG_DESKTOP;
}

export function resolveMapboxStyleUrl(
  styleSlug: string,
  token: string,
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): string {
  const trimmedToken = token.trim();
  if (needsHttpsMapboxStyleUrl(userAgent)) {
    return `https://api.mapbox.com/styles/v1/${styleSlug}?access_token=${encodeURIComponent(trimmedToken)}`;
  }
  return `mapbox://styles/${styleSlug}`;
}
