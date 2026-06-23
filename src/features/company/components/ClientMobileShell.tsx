"use client";

import type { ReactNode } from "react";
import MobileCalendarFooterBar from "@/features/dashboard/components/MobileCalendarFooterBar";
import MobileProfileTopBar from "@/features/dashboard/components/MobileProfileTopBar";
import ClientMobileProfileChip from "@/features/company/components/ClientMobileProfileChip";
import { useMobileShellDockHintAttrs } from "@/features/dashboard/MobileDockOnboardingContext";
import {
  MOBILE_SHELL_BODY_CLASS,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_FOOTER_CLASS,
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  children: ReactNode;
};

/** Shell portail client — profil (header) + calendrier (footer), hub unique. */
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
        <MobileProfileTopBar
          topBarTestId="client-mobile-top-bar"
          railTestId="client-mobile-header-rail"
          profileTestId="client-mobile-header-profile"
        >
          <ClientMobileProfileChip />
        </MobileProfileTopBar>
      </header>

      <div className={`${MOBILE_SHELL_BODY_CLASS} min-h-0 flex-1`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>

      <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="client-mobile-shell-footer">
        <MobileCalendarFooterBar
          footerTestId="client-mobile-footer-calendar-bar"
          railTestId="client-mobile-footer-calendar-rail"
          calendarTestId="client-mobile-footer-calendar"
        />
      </footer>
    </div>
  );
}
