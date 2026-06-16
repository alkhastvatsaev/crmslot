/**
 * Contrat du shell mobile (header profil · panneau central · galaxy dock).
 *
 * Toute modification de `MobileShell`, `MobileScreenHost`, `MobileTopBar`,
 * `DashboardPageSelector*` ou `page.tsx` (providers) doit faire passer :
 *   npm run test:mobile-shell
 *
 * Objectif : éviter les régressions quand d’autres features touchent la carte
 * (WebGL) ou le carrousel sans réintégrer le sélecteur de pages.
 */
export const MOBILE_SHELL_CONTRACT = {
  /** Page carte — toujours montée (WebGL). */
  mapPageIndex: 0,
  layout: {
    slotGridClass: "mobile-shell-slot-grid",
    profileBarClass: "mobile-profile-bar",
    profileBarChromeClass: "mobile-profile-bar-chrome",
    galaxyDockClass: "mobile-galaxy-dock",
    galaxyDockChromeClass: "mobile-galaxy-dock-chrome",
    profileChipClass: "mobile-profile-chip",
    galaxyHeightCssVar: "--mobile-galaxy-height",
    stackGapCssVar: "--mobile-stack-gap",
  },
  testIds: {
    shell: "mobile-shell",
    topBar: "mobile-top-bar",
    profileToggle: "user-profile-toggle",
    screenHost: "mobile-screen-host",
    mapPage: "mobile-page-0",
    pageSelector: "dashboard-page-selector",
    pageSelectorHost: "dashboard-page-selector-host",
    galaxyDock: "mobile-shell-galaxy",
  },
  /** Fichiers dont le comportement est verrouillé par les tests source + intégration. */
  guardedSourceFiles: [
    "src/features/dashboard/components/MobileScreenHost.tsx",
    "src/features/dashboard/components/MobileShell.tsx",
    "src/app/page.tsx",
    "src/features/dashboard/AdminDashboardProviders.tsx",
  ] as const,
  guardedSourceSnippets: {
    "src/features/dashboard/components/MobileScreenHost.tsx": [
      "useDashboardPageSelector",
      "useMobilePageSwipe",
      "stepDashboardLinearPageIndex",
      "dashboard-page-selector-host",
      "pages.slice",
      "selectorOpen",
      "MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS",
    ],
    "src/features/dashboard/components/MobileShell.tsx": [
      "data-page-selector-open",
      "MobileScreenHost",
      "MobileTopBar",
      "DashboardGalaxyLayer",
    ],
    "src/features/dashboard/components/DashboardPageSelector.tsx": [
      "MobileCentralPanelFrame",
      "mobile-page-selector",
    ],
    "src/features/dashboard/components/MobileHubLayout.tsx": [
      "MOBILE_HUB_RAIL_LAYER_CLASS",
      "mobileHubRailLayerSideClass",
      "data-mobile-hub-rail-active",
    ],
    "src/features/dashboard/components/MobileTopBar.tsx": [
      "MobileHeaderRailLayout",
      "ClockCalendar compact",
    ],
    "src/app/page.tsx": ["AdminDashboardProviders", "MobileShell", "DashboardDesktopShell"],
    "src/features/dashboard/AdminDashboardProviders.tsx": [
      "DashboardPageSelectorProvider",
      "DashboardPagerProvider",
    ],
    "src/app/dashboard-mobile-layout.css": [
      "--mobile-stack-gap",
      "gap: var(--mobile-stack-gap)",
      ".mobile-screen-host",
      ".mobile-screen-host-panel--selector",
      ".mobile-hub-rail-layer",
      ".mobile-header-rail-host",
    ],
  } as const,
} as const;
