"use client";

import type { ReactNode } from "react";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileHeaderRailLayout from "@/features/dashboard/components/MobileHeaderRailLayout";
import UserProfile from "@/features/dashboard/components/UserProfile";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
  MOBILE_SHELL_BODY_CLASS,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_FOOTER_CLASS,
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  children: ReactNode;
};

/**
 * Chrome mobile terrain : calendrier (header) + Galaxy dock (footer).
 * Une seule page hub — pas de carrousel 8 pages ni dots bar.
 */
export default function TechnicianMobileShell({ children }: Props) {
  return (
    <div
      className={`${MOBILE_SHELL_CLASS} technician-mobile-app`}
      data-mobile-shell
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
          <MobileHeaderRailLayout
            rootTestId="technician-mobile-header-rail"
            leftTestId="technician-mobile-header-calendar"
            centerTestId="technician-mobile-header-profile"
            swipeDisabled
            left={<ClockCalendar compact interactive />}
            center={<UserProfile variant="mobile" />}
          />
        </MobileShellSlotGrid>
      </header>

      <div className={`${MOBILE_SHELL_BODY_CLASS} min-h-0 flex-1`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>

      <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="technician-mobile-shell-footer">
        <MobileShellSlotGrid
          rootClassName={MOBILE_GALAXY_DOCK_CLASS}
          chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
          data-testid={MOBILE_SHELL_CONTRACT.testIds.galaxyDock}
        >
          <DashboardGalaxyLayer />
        </MobileShellSlotGrid>
      </footer>
    </div>
  );
}
