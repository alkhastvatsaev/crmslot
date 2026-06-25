"use client";

import type { ReactNode } from "react";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileHubDotsBar from "@/features/dashboard/components/MobileHubDotsBar";
import MobileShellFooterDock from "@/features/dashboard/components/MobileShellFooterDock";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import { useMobileFooterGalaxyVisible } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
  MOBILE_HEADER_RAIL_HOST_CLASS,
  MOBILE_SHELL_FOOTER_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type CalendarProps = {
  toggleTarget?: "pages" | "calendar";
  calendarBarTestId?: string;
  railTestId?: string;
  calendarTestId?: string;
};

type Props = {
  dock?: ReactNode;
  galaxyDockTestId?: string;
  footerTestId?: string;
  calendar?: CalendarProps;
};

/**
 * Footer mobile — un seul emplacement dock : calendrier OU Galaxy (jamais les deux).
 * Doit être rendu sous `MobileHubRailProvider` pour la bascule rail agent.
 */
export default function MobileShellFooterDockRow({
  dock = <MobileShellFooterDock />,
  galaxyDockTestId = MOBILE_SHELL_CONTRACT.testIds.galaxyDock,
  footerTestId = "mobile-shell-footer",
  calendar = {},
}: Props) {
  const showGalaxy = useMobileFooterGalaxyVisible();
  const {
    toggleTarget = "pages",
    calendarBarTestId = "mobile-footer-calendar-bar",
    railTestId = "mobile-footer-calendar-rail",
    calendarTestId = "mobile-footer-calendar",
  } = calendar;

  return (
    <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid={footerTestId}>
      <MobileShellSlotGrid
        rootClassName={MOBILE_GALAXY_DOCK_CLASS}
        chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
        data-testid={showGalaxy ? galaxyDockTestId : calendarBarTestId}
      >
        {showGalaxy ? (
          <div className="relative h-full min-h-0 w-full">{dock}</div>
        ) : (
          <div
            className={cn(MOBILE_HEADER_RAIL_HOST_CLASS, "mobile-header-rail-host h-full w-full")}
            data-testid={railTestId}
          >
            <div
              data-testid={calendarTestId}
              data-mobile-header-rail="left"
              data-mobile-header-rail-active="true"
              className="mobile-header-rail-layer flex h-full w-full min-h-0 items-stretch"
            >
              <ClockCalendar compact interactive toggleTarget={toggleTarget} />
            </div>
          </div>
        )}
      </MobileShellSlotGrid>
      <MobileHubDotsBar />
    </footer>
  );
}
