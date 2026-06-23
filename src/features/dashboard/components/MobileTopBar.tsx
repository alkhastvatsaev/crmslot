"use client";

import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import {
  MOBILE_HEADER_RAIL_HOST_CLASS,
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import { cn } from "@/lib/utils";

/** Header mobile — calendrier fixe (ouvre le sélecteur de pages au clic). */
export default function MobileTopBar() {
  return (
    <MobileShellSlotGrid
      rootClassName={MOBILE_PROFILE_BAR_CLASS}
      chromeClassName={MOBILE_PROFILE_BAR_CHROME_CLASS}
      data-testid={MOBILE_SHELL_CONTRACT.testIds.topBar}
    >
      <div
        className={cn(MOBILE_HEADER_RAIL_HOST_CLASS, "mobile-header-rail-host h-full w-full")}
        data-testid="mobile-header-rail"
      >
        <div
          data-testid="mobile-header-calendar"
          data-mobile-header-rail="left"
          data-mobile-header-rail-active="true"
          className="mobile-header-rail-layer flex h-full w-full min-h-0 items-stretch"
        >
          <ClockCalendar compact interactive />
        </div>
      </div>
    </MobileShellSlotGrid>
  );
}
