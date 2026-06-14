import type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";

export const MOBILE_HUB_RAIL_LAYER_CLASS = "mobile-hub-rail-layer";
export const MOBILE_HUB_RAIL_LAYER_ACTIVE_CLASS = "mobile-hub-rail-layer--active";
export const MOBILE_HUB_RAIL_LAYER_BEFORE_CLASS = "mobile-hub-rail-layer--before";
export const MOBILE_HUB_RAIL_LAYER_AFTER_CLASS = "mobile-hub-rail-layer--after";
export const MOBILE_HUB_PANEL_ANIMATED_CLASS = "mobile-hub-panel--animated";

export function mobileHubRailLayerSideClass(
  railKey: MobileHubRail,
  activeRail: MobileHubRail,
  availableRails: readonly MobileHubRail[]
): string | undefined {
  if (railKey === activeRail) return MOBILE_HUB_RAIL_LAYER_ACTIVE_CLASS;
  const index = availableRails.indexOf(railKey);
  const activeIndex = availableRails.indexOf(activeRail);
  if (index < activeIndex) return MOBILE_HUB_RAIL_LAYER_BEFORE_CLASS;
  if (index > activeIndex) return MOBILE_HUB_RAIL_LAYER_AFTER_CLASS;
  return undefined;
}

/** Swipe horizontal entre rails — s'arrête aux extrémités (pas de boucle). */
export function stepMobileHubRail(
  rails: readonly MobileHubRail[],
  current: MobileHubRail,
  direction: "next" | "prev"
): MobileHubRail {
  const idx = rails.indexOf(current);
  if (idx < 0) return current;
  if (direction === "next") return rails[idx + 1] ?? current;
  return rails[idx - 1] ?? current;
}
