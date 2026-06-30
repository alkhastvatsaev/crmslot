"use client";

import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import MobileScreenHostPanel from "@/features/dashboard/components/MobileScreenHostPanel";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import type { MobilePageTransitionState } from "@/features/dashboard/hooks/useMobilePageTransition";
import {
  MOBILE_SCREEN_HOST_CLASS,
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  pages: React.ReactNode[];
  pageTransition: MobilePageTransitionState;
};

const visiblePanelClass = cn(MOBILE_SCREEN_HOST_PANEL_CLASS, MOBILE_SCREEN_HOST_PANEL_BASE_CLASS);

/**
 * Panneau central mobile — une seule page montée (hub actif). Hors écran = démontage React
 * (thermique iOS). Navigation : sélecteur calendrier / profil.
 *
 * Contrat : voir `mobileShellContract.ts` + `npm run test:mobile-shell`.
 */
export default function MobileScreenHost({ pages, pageTransition }: Props) {
  const { pageIndex, pageCount } = useDashboardPager();
  const { view, close: closeOverlay } = useDashboardPageSelector();
  const overlayOpen = view !== "closed";
  const { mountedIndices, getPanelPhase } = pageTransition;

  return (
    <main className={MOBILE_SCREEN_HOST_CLASS} data-testid="mobile-screen-host" aria-live="polite">
      {pages.slice(0, pageCount).map((page, index) => {
        if (!mountedIndices.has(index)) return null;

        const phase = getPanelPhase(index, overlayOpen);
        return (
          <MobileScreenHostPanel key={index} index={index} phase={phase}>
            {page}
          </MobileScreenHostPanel>
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
