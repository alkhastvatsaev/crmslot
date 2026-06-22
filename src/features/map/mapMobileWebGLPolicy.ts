import { isMapWebGLActive } from "@/features/map/mapboxPowerProfile";

/** WebGL Mapbox sur téléphone — toujours actif quand la carte est visible. */
export function resolveMapWebGLActive(
  isMobile: boolean | null,
  dashboardPageIndex: number,
  mapRenderActive: boolean,
  _mobileMapWebGLEnabled: boolean
): boolean {
  return isMapWebGLActive(isMobile, dashboardPageIndex, mapRenderActive);
}
