/**
 * Dashboard mobile layout — TypeScript surface (classes + numeric constants).
 * CSS source of truth: `src/app/dashboard-mobile-layout.css`
 *
 * Panneaux hub : même chrome `.panel-glass` que desktop (`panel-tokens.css`).
 * Mapping rails : `docs/agents/MOBILE_DESKTOP_PANELS.md`
 */

import { glassPanelShellClass } from "@/core/ui/glassPanelChrome";

export const MOBILE_SHELL_PAD_X_PX = 16;

export const MOBILE_HEADER_HEIGHT_PX = 52;

export const MOBILE_TAB_BAR_HEIGHT_PX = 52;

export const MOBILE_GALAXY_HEIGHT_PX = 56;

/** Aligné sur desktop `.panel-glass` (24px). */
export const MOBILE_PANEL_RADIUS_PX = 24;

export const MOBILE_PANEL_GAP_PX = 16;

export const MOBILE_CSS_VAR = {
  shellPadX: "--mobile-shell-pad-x",
  headerHeight: "--mobile-header-height",
  tabBarHeight: "--mobile-tab-bar-height",
  galaxyHeight: "--mobile-galaxy-height",
  panelRadius: "--mobile-panel-radius",
  panelGap: "--mobile-panel-gap",
  controlRadius: "--mobile-control-radius",
  controlRadiusNested: "--mobile-control-radius-nested",
  stackGap: "--mobile-stack-gap",
  panelWidth: "--mobile-panel-width",
  mapRecenterOffset: "--mobile-map-recenter-offset",
} as const;

export const MOBILE_SHELL_CLASS = "mobile-shell";
export const MOBILE_SHELL_HEADER_CLASS = "mobile-shell-header";
export const MOBILE_SHELL_BODY_CLASS = "mobile-shell-body";
export const MOBILE_SHELL_FOOTER_CLASS = "mobile-shell-footer";

export const MOBILE_GALAXY_DOCK_CLASS = "mobile-galaxy-dock";
export const MOBILE_GALAXY_DOCK_CHROME_BASE_CLASS = "mobile-galaxy-dock-chrome";

/**
 * Coque dock footer — le chip `mobile-header-chip` porte le chrome visuel
 * (identique au calendrier header). Pas de `.panel-glass` ici : évite le
 * double calque ombre + blur iOS sous le pill profil.
 */
export const MOBILE_GALAXY_DOCK_CHROME_CLASS = MOBILE_GALAXY_DOCK_CHROME_BASE_CLASS;

/** Grille gouttière | contenu | gouttière (profil + galaxy). */
export const MOBILE_SHELL_SLOT_GRID_CLASS = "mobile-shell-slot-grid";
export const MOBILE_PROFILE_BAR_CLASS = "mobile-profile-bar";
export const MOBILE_PROFILE_BAR_CHROME_CLASS = "mobile-profile-bar-chrome";
export const MOBILE_HEADER_RAIL_HOST_CLASS = "mobile-header-rail-host";

export const MOBILE_SCREEN_HOST_CLASS = "mobile-screen-host";
export const MOBILE_SCREEN_HOST_PANEL_CLASS = "mobile-screen-host-panel";
export const MOBILE_SCREEN_HOST_PANEL_BASE_CLASS = "mobile-screen-host-panel--base";
export const MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS = "mobile-screen-host-panel--selector";

/** Phases d'animation entre hubs — voir `mobilePageTransition.ts`. */
export const MOBILE_SCREEN_HOST_PANEL_ACTIVE_CLASS = "mobile-screen-host-panel--active";
export const MOBILE_SCREEN_HOST_PANEL_ENTER_NEXT_CLASS = "mobile-screen-host-panel--enter-next";
export const MOBILE_SCREEN_HOST_PANEL_ENTER_PREV_CLASS = "mobile-screen-host-panel--enter-prev";
export const MOBILE_SCREEN_HOST_PANEL_EXIT_NEXT_CLASS = "mobile-screen-host-panel--exit-next";
export const MOBILE_SCREEN_HOST_PANEL_EXIT_PREV_CLASS = "mobile-screen-host-panel--exit-prev";
export const MOBILE_SCREEN_HOST_PANEL_SUSPENDED_CLASS = "mobile-screen-host-panel--suspended";

export const MOBILE_SCREEN_HOST_PANEL_PHASE_CLASS = {
  active: MOBILE_SCREEN_HOST_PANEL_ACTIVE_CLASS,
  "enter-next": MOBILE_SCREEN_HOST_PANEL_ENTER_NEXT_CLASS,
  "enter-prev": MOBILE_SCREEN_HOST_PANEL_ENTER_PREV_CLASS,
  "exit-next": MOBILE_SCREEN_HOST_PANEL_EXIT_NEXT_CLASS,
  "exit-prev": MOBILE_SCREEN_HOST_PANEL_EXIT_PREV_CLASS,
  suspended: MOBILE_SCREEN_HOST_PANEL_SUSPENDED_CLASS,
} as const;

/** Overlay compte terrain/admin — plein corps, fond opaque (évite le rail hub visible sur iOS). */
export const MOBILE_SHELL_ACCOUNT_OVERLAY_CLASS = "mobile-shell-account-overlay";

export const MOBILE_TOP_BAR_CLASS = "mobile-top-bar";

export const MOBILE_TAB_BAR_CLASS = "mobile-tab-bar";

export const MOBILE_HUB_LAYOUT_CLASS = "mobile-hub-layout";
export const MOBILE_HUB_DOTS_BAR_CLASS = "mobile-hub-dots-bar";
export const MOBILE_RAIL_SEGMENT_CLASS = "mobile-rail-segment";
export const MOBILE_RAIL_SEGMENT_BTN_CLASS = "mobile-rail-segment-btn";
export const MOBILE_HUB_PANEL_SHELL_CLASS = "mobile-hub-panel-shell";

/** @deprecated Préférer `mobileHubPanelGlassShellClass` + `GlassPanel`. */
export const MOBILE_HUB_PANEL_CLASS = "mobile-hub-panel";

/** Coque glass mobile — ombres et blur identiques au desktop, radius via `--mobile-panel-radius`. */
export const mobileHubPanelGlassShellClass = glassPanelShellClass({
  bg: "bg-white/76",
  layoutClass: `${MOBILE_HUB_PANEL_SHELL_CLASS} relative flex min-h-0 w-full max-w-full flex-col`,
  heightClass: "",
  extra: "rounded-[var(--mobile-panel-radius)]",
});
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
