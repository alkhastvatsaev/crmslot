"use client";

import type { ReactNode } from "react";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import ClientMobileProfileChip from "@/features/company/components/ClientMobileProfileChip";
import { useMobileShellDockHintAttrs } from "@/features/dashboard/MobileDockOnboardingContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
  MOBILE_HEADER_RAIL_HOST_CLASS,
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
  MOBILE_SHELL_BODY_CLASS,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_FOOTER_CLASS,
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
};

/** Shell portail client — calendrier (header) + profil dock (footer), hub unique. */
export default function ClientMobileShell({ children }: Props) {
  const dockHintAttrs = useMobileShellDockHintAttrs();

  return (
    <div
      className={`${MOBILE_SHELL_CLASS} client-mobile-app`}
      data-mobile-shell
      data-testid="client-mobile-app"
      {...dockHintAttrs}
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
          <div
            className={cn(MOBILE_HEADER_RAIL_HOST_CLASS, "mobile-header-rail-host h-full w-full")}
            data-testid="client-mobile-header-rail"
          >
            <div
              data-testid="client-mobile-header-calendar"
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>

      <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="client-mobile-shell-footer">
        <MobileShellSlotGrid
          rootClassName={MOBILE_GALAXY_DOCK_CLASS}
          chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
          data-testid={MOBILE_SHELL_CONTRACT.testIds.galaxyDock}
        >
          <ClientMobileProfileChip />
        </MobileShellSlotGrid>
      </footer>
    </div>
  );
}
