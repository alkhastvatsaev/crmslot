"use client";

import { useCallback, useRef } from "react";
import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { stepDashboardLinearPageIndex } from "@/features/dashboard/dashboardCarouselRegistry";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useMobilePageSwipe } from "@/features/dashboard/hooks/useMobilePageSwipe";
import {
  MOBILE_SCREEN_HOST_CLASS,
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  pages: React.ReactNode[];
};

const visiblePanelClass = cn(MOBILE_SCREEN_HOST_PANEL_CLASS, MOBILE_SCREEN_HOST_PANEL_BASE_CLASS);

/**
 * Affiche une page hub à la fois.
 * Page 0 (carte Mapbox) reste montée en DOM pour éviter la réinitialisation WebGL.
 *
 * Contrat : voir `mobileShellContract.ts` + `npm run test:mobile-shell`.
 */
export default function MobileScreenHost({ pages }: Props) {
  const hostRef = useRef<HTMLElement>(null);
  const { pageIndex, pageCount, setPageIndex } = useDashboardPager();
  const { open: selectorOpen, close: closeSelector } = useDashboardPageSelector();
  const mapHidden = selectorOpen || pageIndex !== 0;

  const swipeNextPage = useCallback(() => {
    setPageIndex(stepDashboardLinearPageIndex(pageIndex, "next", pageCount));
  }, [pageCount, pageIndex, setPageIndex]);

  const swipePrevPage = useCallback(() => {
    setPageIndex(stepDashboardLinearPageIndex(pageIndex, "prev", pageCount));
  }, [pageCount, pageIndex, setPageIndex]);

  useMobilePageSwipe(hostRef, swipeNextPage, swipePrevPage, selectorOpen);

  return (
    <main
      ref={hostRef}
      className={MOBILE_SCREEN_HOST_CLASS}
      data-testid="mobile-screen-host"
      aria-live="polite"
    >
      <div
        className={cn(
          MOBILE_SCREEN_HOST_PANEL_CLASS,
          MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
          mapHidden && "mobile-screen-host-panel--suspended"
        )}
        aria-hidden={mapHidden}
        inert={mapHidden ? true : undefined}
        data-testid="mobile-page-0"
      >
        {pages[0]}
      </div>

      {selectorOpen ? (
        <div
          className={cn(visiblePanelClass, MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS)}
          data-testid="dashboard-page-selector-host"
        >
          <DashboardPageSelector onClose={closeSelector} variant="mobile" />
        </div>
      ) : pageIndex !== 0 ? (
        <div className={visiblePanelClass} data-testid={`mobile-page-${pageIndex}`}>
          {pages[pageIndex] ?? null}
        </div>
      ) : null}
    </main>
  );
}
