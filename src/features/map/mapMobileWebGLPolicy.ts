import { isMapWebGLActive } from "@/features/map/mapboxPowerProfile";

/**
 * WebGL Mapbox sur téléphone — désactivé par défaut (batterie / diagnostic).
 * Activer via feature flag `mobileMapWebGL` (mode ultra premium).
 */
export function resolveMapWebGLActive(
  isMobile: boolean | null,
  dashboardPageIndex: number,
  mapRenderActive: boolean,
  mobileMapWebGLEnabled: boolean
): boolean {
  if (!isMapWebGLActive(isMobile, dashboardPageIndex, mapRenderActive)) {
    return false;
  }
  if (isMobile === true && !mobileMapWebGLEnabled) {
    return false;
  }
  return true;
}
