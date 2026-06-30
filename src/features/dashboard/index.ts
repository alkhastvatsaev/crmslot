/**
 * API publique dashboard — shell admin, carrousel pager et layout desktop/mobile.
 * Ordre slots = `DASHBOARD_CAROUSEL_PAGES` (doit matcher `src/app/page.tsx`).
 */
export { default as AdminDashboardProviders } from "@/features/dashboard/AdminDashboardProviders";
export { default as AdminMobileProviders } from "@/features/dashboard/AdminMobileProviders";
export {
  ADMIN_MOBILE_APP_ROUTE,
  ADMIN_MOBILE_APP_SLOT_INDEX,
  isAdminMobileAppPath,
} from "@/features/dashboard/adminMobileAppConstants";
export {
  DashboardPagerProvider,
  useDashboardPager,
  useDashboardPagerOptional,
} from "@/features/dashboard/dashboardPagerContext";
export type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";
export {
  DashboardPageSelectorProvider,
  useDashboardPageSelector,
  useDashboardPageSelectorOptional,
} from "@/features/dashboard/DashboardPageSelectorContext";
export type { DashboardOverlayView } from "@/features/dashboard/DashboardPageSelectorContext";
export type {
  DashboardCarouselRoleKey,
  DashboardCarouselPageDef,
} from "@/features/dashboard/dashboardCarouselRegistry";
export {
  DASHBOARD_CAROUSEL_PAGES,
  DASHBOARD_CAROUSEL_PAGE_COUNT,
  DASHBOARD_CAROUSEL_NAV_SLOT_INDICES,
  isDashboardCarouselNavSlot,
  getNextDashboardCarouselNavIndex,
  getPrevDashboardCarouselNavIndex,
  stepDashboardCarouselNavIndex,
  stepDashboardLinearPageIndex,
  assertDashboardCarouselSlotAlignment,
  getDashboardCarouselPage,
  getDashboardCarouselHubPages,
  clampDashboardCarouselPageIndex,
} from "@/features/dashboard/dashboardCarouselRegistry";
export { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
export { useHubPageActive } from "@/features/dashboard/hooks/useHubPageActive";
export { useHubAnyRailActive, useHubRailActive } from "@/features/dashboard/hooks/useHubRailActive";
export { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
export { useMobileFooterGalaxyVisible } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
export { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
export {
  MobileHubRailProvider,
  useMobileHubRailSnapshot,
  useRequestMobileHubRail,
} from "@/features/dashboard/MobileHubRailContext";
export type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";
export { default as DashboardPager } from "@/features/dashboard/components/DashboardPager";
export { default as DashboardDesktopShell } from "@/features/dashboard/components/DashboardDesktopShell";
export { default as MobileShell } from "@/features/dashboard/components/MobileShell";
export { default as AdminMobileShell } from "@/features/dashboard/components/AdminMobileShell";
export { default as AdaptiveTriplePanelLayout } from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
export { default as MobileHubLayout } from "@/features/dashboard/components/MobileHubLayout";
export { default as DailyMissions } from "@/features/dashboard/components/DailyMissions";
export { default as MacroDroidIndicator } from "@/features/dashboard/components/MacroDroidIndicator";
export { default as AutoProcessUploads } from "@/features/dashboard/components/AutoProcessUploads";
