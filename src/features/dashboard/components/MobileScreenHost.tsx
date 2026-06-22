"use client";

import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useMobileMountedPageIndices } from "@/features/dashboard/hooks/useMobileMountedPageIndices";
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
 * Panneau central mobile — page carte (0) toujours montée ; les autres hubs se montent à la
 * première visite puis restent en keep-alive (visibilité CSS, pas de démontage).
 * Navigation entre pages : sélecteur (calendrier / profil), pas de swipe vertical.
 *
 * Contrat : voir `mobileShellContract.ts` + `npm run test:mobile-shell`.
 */
export default function MobileScreenHost({ pages }: Props) {
  const { pageIndex, pageCount } = useDashboardPager();
  const { view, close: closeOverlay } = useDashboardPageSelector();
  const overlayOpen = view !== "closed";
  const mountedPageIndices = useMobileMountedPageIndices(pageIndex);

  return (
    <main className={MOBILE_SCREEN_HOST_CLASS} data-testid="mobile-screen-host" aria-live="polite">
      {pages.slice(0, pageCount).map((page, index) => {
        if (!mountedPageIndices.has(index)) return null;

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
