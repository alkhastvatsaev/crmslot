import { isMapWebGLActive } from "@/features/map/mapboxPowerProfile";

/** WebGL Mapbox sur téléphone — actif si flag `mobileMapWebGL` et carte visible. */
export function resolveMapWebGLActive(
  isMobile: boolean | null,
  dashboardPageIndex: number,
  mapRenderActive: boolean,
  mobileMapWebGLEnabled: boolean
): boolean {
  if (isMobile === true && !mobileMapWebGLEnabled) return false;
  return isMapWebGLActive(isMobile, dashboardPageIndex, mapRenderActive);
}
