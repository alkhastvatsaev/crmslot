"use client";

import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useMobilePageTransition } from "@/features/dashboard/hooks/useMobilePageTransition";
import {
  MOBILE_SCREEN_HOST_CLASS,
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_PHASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  pages: React.ReactNode[];
};

const visiblePanelClass = cn(MOBILE_SCREEN_HOST_PANEL_CLASS, MOBILE_SCREEN_HOST_PANEL_BASE_CLASS);

/**
 * Panneau central mobile — une seule page montée (hub actif). Hors écran = démontage React
 * (thermique iOS). Navigation : sélecteur calendrier / profil.
 *
 * Contrat : voir `mobileShellContract.ts` + `npm run test:mobile-shell`.
 */
export default function MobileScreenHost({ pages }: Props) {
  const { pageIndex, pageCount } = useDashboardPager();
  const { view, close: closeOverlay } = useDashboardPageSelector();
  const overlayOpen = view !== "closed";
  const { mountedIndices, getPanelPhase } = useMobilePageTransition(pageIndex);

  return (
    <main className={MOBILE_SCREEN_HOST_CLASS} data-testid="mobile-screen-host" aria-live="polite">
      {pages.slice(0, pageCount).map((page, index) => {
        if (!mountedIndices.has(index)) return null;

        const phase = getPanelPhase(index, overlayOpen);
        const hidden = phase === "suspended" || phase === "exit-next" || phase === "exit-prev";
        const inert = phase !== "active";
        return (
          <div
            key={index}
            className={cn(
              MOBILE_SCREEN_HOST_PANEL_CLASS,
              MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
              MOBILE_SCREEN_HOST_PANEL_PHASE_CLASS[phase]
            )}
            aria-hidden={hidden}
            inert={inert ? true : undefined}
            data-testid={`mobile-page-${index}`}
            data-mobile-page-phase={phase}
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
