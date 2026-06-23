import { isMapWebGLActive } from "@/features/map/mapboxPowerProfile";

/** WebGL Mapbox sur mobile quand la page carte et le rail « carte » sont visibles. */
export function resolveMapWebGLActive(
  isMobile: boolean | null,
  dashboardPageIndex: number,
  mapRenderActive: boolean
): boolean {
  return isMapWebGLActive(isMobile, dashboardPageIndex, mapRenderActive);
}
