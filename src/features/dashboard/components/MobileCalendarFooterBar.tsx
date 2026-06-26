"use client";

import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
  MOBILE_HEADER_RAIL_HOST_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  toggleTarget?: "pages" | "calendar";
  /** Faux sur le portail client : le dock calendrier n’ouvre pas la navigation admin. */
  interactive?: boolean;
  footerTestId?: string;
  railTestId?: string;
  calendarTestId?: string;
};

/** Dock calendrier / horloge en bas — ouvre le sélecteur de pages ou le calendrier mois. */
export default function MobileCalendarFooterBar({
  toggleTarget = "pages",
  interactive = true,
  footerTestId = "mobile-footer-calendar-bar",
  railTestId = "mobile-footer-calendar-rail",
  calendarTestId = "mobile-footer-calendar",
}: Props) {
  return (
    <MobileShellSlotGrid
      rootClassName={MOBILE_GALAXY_DOCK_CLASS}
      chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
      data-testid={footerTestId}
    >
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
          <ClockCalendar compact interactive={interactive} toggleTarget={toggleTarget} />
        </div>
      </div>
    </MobileShellSlotGrid>
  );
}
