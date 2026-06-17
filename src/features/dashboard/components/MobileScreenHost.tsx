"use client";

import { useCallback, useRef } from "react";
import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
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

function isMobilePageHidden(pageIndex: number, activeIndex: number, overlayOpen: boolean): boolean {
  return overlayOpen || activeIndex !== pageIndex;
}

/**
 * Panneau central mobile — même invariant que `DashboardPager` desktop :
 * toutes les pages restent montées ; seule la visibilité change (header + galaxy inchangés).
 *
 * Contrat : voir `mobileShellContract.ts` + `npm run test:mobile-shell`.
 */
export default function MobileScreenHost({ pages }: Props) {
  const hostRef = useRef<HTMLElement>(null);
  const { pageIndex, pageCount, setPageIndex } = useDashboardPager();
  const { view, close: closeOverlay } = useDashboardPageSelector();
  const overlayOpen = view !== "closed";

  const swipeNextPage = useCallback(() => {
    setPageIndex(stepDashboardLinearPageIndex(pageIndex, "next", pageCount));
  }, [pageCount, pageIndex, setPageIndex]);

  const swipePrevPage = useCallback(() => {
    setPageIndex(stepDashboardLinearPageIndex(pageIndex, "prev", pageCount));
  }, [pageCount, pageIndex, setPageIndex]);

  useMobilePageSwipe(hostRef, swipeNextPage, swipePrevPage, overlayOpen);

  return (
    <main
      ref={hostRef}
      className={MOBILE_SCREEN_HOST_CLASS}
      data-testid="mobile-screen-host"
      aria-live="polite"
    >
      {pages.slice(0, pageCount).map((page, index) => {
        const hidden = isMobilePageHidden(index, pageIndex, overlayOpen);
        return (
          <div
            key={index}
            className={cn(
              MOBILE_SCREEN_HOST_PANEL_CLASS,
              MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
              hidden && "mobile-screen-host-panel--suspended"
            )}
            aria-hidden={hidden}
            inert={hidden ? true : undefined}
            data-testid={`mobile-page-${index}`}
          >
            {page}
          </div>
        );
      })}

      {view === "pages" ? (
        <div
          className={cn(visiblePanelClass, MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS)}
          data-testid="dashboard-page-selector-host"
        >
          <DashboardPageSelector onClose={closeOverlay} variant="mobile" />
        </div>
      ) : null}

      {view === "account" ? (
        <div
          className={cn(visiblePanelClass, MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS)}
          data-testid="dashboard-account-panel-host"
        >
          <DashboardAccountPanel onClose={closeOverlay} variant="mobile" />
        </div>
      ) : null}
    </main>
  );
}
