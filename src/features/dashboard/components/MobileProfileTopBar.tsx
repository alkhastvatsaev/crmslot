"use client";

import type { ReactNode } from "react";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import {
  MOBILE_HEADER_RAIL_HOST_CLASS,
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  topBarTestId?: string;
  railTestId?: string;
  profileTestId?: string;
};

/** Bandeau profil fixe en haut (dock compte / navigation). */
export default function MobileProfileTopBar({
  children,
  topBarTestId = MOBILE_SHELL_CONTRACT.testIds.topBar,
  railTestId = "mobile-header-profile-rail",
  profileTestId = "mobile-header-profile",
}: Props) {
  return (
    <MobileShellSlotGrid
      rootClassName={MOBILE_PROFILE_BAR_CLASS}
      chromeClassName={MOBILE_PROFILE_BAR_CHROME_CLASS}
      data-testid={topBarTestId}
    >
      <div
        className={cn(MOBILE_HEADER_RAIL_HOST_CLASS, "mobile-header-rail-host h-full w-full")}
        data-testid={railTestId}
      >
        <div
          data-testid={profileTestId}
          data-mobile-header-rail="left"
          data-mobile-header-rail-active="true"
          className="mobile-header-rail-layer flex h-full w-full min-h-0 items-stretch"
        >
          {children}
        </div>
      </div>
    </MobileShellSlotGrid>
  );
}
