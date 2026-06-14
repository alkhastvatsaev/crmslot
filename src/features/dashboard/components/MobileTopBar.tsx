"use client";

import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import MobileHeaderRailLayout from "@/features/dashboard/components/MobileHeaderRailLayout";
import UserProfile from "@/features/dashboard/components/UserProfile";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import {
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";

export default function MobileTopBar() {
  const { open: pageSelectorOpen } = useDashboardPageSelector();

  return (
    <MobileShellSlotGrid
      rootClassName={MOBILE_PROFILE_BAR_CLASS}
      chromeClassName={MOBILE_PROFILE_BAR_CHROME_CLASS}
      data-testid={MOBILE_SHELL_CONTRACT.testIds.topBar}
    >
      <MobileHeaderRailLayout
        rootTestId="mobile-header-rail"
        leftTestId="mobile-header-calendar"
        centerTestId="mobile-header-profile"
        swipeDisabled={pageSelectorOpen}
        left={<ClockCalendar compact interactive />}
        center={<UserProfile interactive variant="mobile" />}
      />
    </MobileShellSlotGrid>
  );
}
