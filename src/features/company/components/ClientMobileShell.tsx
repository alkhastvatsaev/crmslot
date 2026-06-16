"use client";

import type { ReactNode } from "react";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileHeaderRailLayout from "@/features/dashboard/components/MobileHeaderRailLayout";
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

/** Shell portail client — calendrier (header) + Galaxy dock (footer), hub unique. */
export default function ClientMobileShell({ children }: Props) {
  return (
    <div
      className={`${MOBILE_SHELL_CLASS} client-mobile-app`}
      data-mobile-shell
      data-testid="client-mobile-app"
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
          data-testid="client-mobile-top-bar"
        >
          <MobileHeaderRailLayout
            rootTestId="client-mobile-header-rail"
            leftTestId="client-mobile-header-calendar"
            centerTestId="client-mobile-header-title"
            swipeDisabled
            left={<ClockCalendar compact interactive />}
            center={
              <div className="mobile-header-chip flex h-full w-full items-center justify-center px-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                  Demande
                </span>
              </div>
            }
          />
        </MobileShellSlotGrid>
      </header>

      <div className={`${MOBILE_SHELL_BODY_CLASS} min-h-0 flex-1`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>

      <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="client-mobile-shell-footer">
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
