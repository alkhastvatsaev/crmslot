/** Mode page carte admin — lite évite le bundle Mapbox WebGL sur mobile. */
export type AdminMapPageMode = "mapbox" | "lite";

export function resolveAdminMapPageMode(
  isMobile: boolean | null,
  mobileMapWebGLEnabled: boolean
): AdminMapPageMode {
  if (isMobile === true && !mobileMapWebGLEnabled) return "lite";
  return "mapbox";
}
