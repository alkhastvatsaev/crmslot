/**
 * Dashboard mobile layout — TypeScript surface (classes + numeric constants).
 * CSS source of truth: `src/app/dashboard-mobile-layout.css`
 */

export const MOBILE_SHELL_PAD_X_PX = 16;

export const MOBILE_HEADER_HEIGHT_PX = 52;

export const MOBILE_TAB_BAR_HEIGHT_PX = 52;

export const MOBILE_GALAXY_HEIGHT_PX = 56;

export const MOBILE_PANEL_RADIUS_PX = 20;

export const MOBILE_PANEL_GAP_PX = 16;

export const MOBILE_CSS_VAR = {
  shellPadX: "--mobile-shell-pad-x",
  headerHeight: "--mobile-header-height",
  tabBarHeight: "--mobile-tab-bar-height",
  galaxyHeight: "--mobile-galaxy-height",
  panelRadius: "--mobile-panel-radius",
  panelGap: "--mobile-panel-gap",
  panelWidth: "--mobile-panel-width",
  mapRecenterOffset: "--mobile-map-recenter-offset",
} as const;

export const MOBILE_SHELL_CLASS = "mobile-shell";
export const MOBILE_SHELL_HEADER_CLASS = "mobile-shell-header";
export const MOBILE_SHELL_BODY_CLASS = "mobile-shell-body";
export const MOBILE_SHELL_FOOTER_CLASS = "mobile-shell-footer";

export const MOBILE_GALAXY_DOCK_CLASS = "mobile-galaxy-dock";
export const MOBILE_GALAXY_DOCK_CHROME_CLASS = "mobile-galaxy-dock-chrome";

export const MOBILE_SCREEN_HOST_CLASS = "mobile-screen-host";

export const MOBILE_TOP_BAR_CLASS = "mobile-top-bar";

export const MOBILE_TAB_BAR_CLASS = "mobile-tab-bar";

export const MOBILE_HUB_LAYOUT_CLASS = "mobile-hub-layout";
export const MOBILE_RAIL_SEGMENT_CLASS = "mobile-rail-segment";
export const MOBILE_RAIL_SEGMENT_BTN_CLASS = "mobile-rail-segment-btn";
export const MOBILE_HUB_PANEL_CLASS = "mobile-hub-panel";
export const MOBILE_HUB_PANEL_INNER_CLASS = "mobile-hub-panel-inner";
export const MOBILE_HUB_PANEL_INNER_SCROLL_CLASS =
  "mobile-hub-panel-inner mobile-hub-panel-inner--scroll";
export const MOBILE_HUB_PANEL_INNER_PADDED_CLASS =
  "mobile-hub-panel-inner mobile-hub-panel-inner--padded";

export const MOBILE_HEADER_CHIP_CLASS = "mobile-header-chip";
export const MOBILE_HEADER_CHIP_INTERACTIVE_CLASS =
  "mobile-header-chip mobile-header-chip--interactive";

export const MOBILE_MAP_RECENTER_BTN_CLASS = "mobile-map-recenter-btn";

export const mobileHeaderStripHeightClass = "h-[var(--mobile-header-height)]";

/** @deprecated Ancien carrousel horizontal — conservé pour tests legacy. */
export const MOBILE_SNAP_STRIP_CLASS = "mobile-snap-strip";
export const MOBILE_RAIL_PANEL_CLASS = "mobile-rail-panel";
