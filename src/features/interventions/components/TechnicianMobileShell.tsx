"use client";

import type { ReactNode } from "react";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import TechnicianMobileProfileChip from "@/features/interventions/components/TechnicianMobileProfileChip";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
  MOBILE_HEADER_RAIL_HOST_CLASS,
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
  MOBILE_SHELL_BODY_CLASS,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_FOOTER_CLASS,
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
};

const accountOverlayClass = cn(
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS
);

/**
 * Chrome mobile terrain : calendrier (header) + profil dock (footer, à la place de Galaxy).
 */
export default function TechnicianMobileShell({ children }: Props) {
  const { view, close: closeOverlay, open: overlayOpen } = useDashboardPageSelector();
  const accountOpen = view === "account";

  return (
    <div
      className={`${MOBILE_SHELL_CLASS} technician-mobile-app`}
      data-mobile-shell
      data-page-selector-open={overlayOpen ? "true" : undefined}
      data-testid="technician-mobile-app"
    >
      <div
        id="dashboard-overlay-root"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden
      />

      <header className={MOBILE_SHELL_HEADER_CLASS}>
        <MobileShellSlotGrid
          rootClassName={MOBILE_PROFILE_BAR_CLASS}
          chromeClassName={MOBILE_PROFILE_BAR_CHROME_CLASS}
          data-testid={MOBILE_SHELL_CONTRACT.testIds.topBar}
        >
          <div
            className={cn(MOBILE_HEADER_RAIL_HOST_CLASS, "mobile-header-rail-host h-full w-full")}
            data-testid="technician-mobile-header-rail"
          >
            <div
              data-testid="technician-mobile-header-calendar"
              data-mobile-header-rail="left"
              data-mobile-header-rail-active="true"
              className="mobile-header-rail-layer flex h-full w-full min-h-0 items-stretch"
            >
              <ClockCalendar compact interactive />
            </div>
          </div>
        </MobileShellSlotGrid>
      </header>

      <div className={`${MOBILE_SHELL_BODY_CLASS} min-h-0 flex-1`}>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            aria-hidden={accountOpen ? true : undefined}
            inert={accountOpen ? true : undefined}
          >
            {children}
          </div>

          {accountOpen ? (
            <div
              className={accountOverlayClass}
              data-testid={MOBILE_SHELL_CONTRACT.testIds.accountPanelHost}
            >
              <DashboardAccountPanel onClose={closeOverlay} variant="mobile" />
            </div>
          ) : null}
        </div>
      </div>

      <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="technician-mobile-shell-footer">
        <MobileShellSlotGrid
          rootClassName={MOBILE_GALAXY_DOCK_CLASS}
          chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
          data-testid="technician-mobile-profile-dock"
        >
          <TechnicianMobileProfileChip />
        </MobileShellSlotGrid>
      </footer>
    </div>
  );
}
