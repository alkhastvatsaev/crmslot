"use client";

import type { ReactNode } from "react";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import MobileCalendarFooterBar from "@/features/dashboard/components/MobileCalendarFooterBar";
import MobileHubDotsBar from "@/features/dashboard/components/MobileHubDotsBar";
import MobileProfileTopBar from "@/features/dashboard/components/MobileProfileTopBar";
import TechnicianMobileProfileChip from "@/features/interventions/components/TechnicianMobileProfileChip";
import { useDashboardPageSelector } from "@/features/dashboard";
import { useMobileShellDockHintAttrs } from "@/features/dashboard/MobileDockOnboardingContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
  MOBILE_SHELL_ACCOUNT_OVERLAY_CLASS,
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
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
  MOBILE_SHELL_ACCOUNT_OVERLAY_CLASS
);

/**
 * Chrome mobile terrain : profil (header) + calendrier dock (footer).
 */
export default function TechnicianMobileShell({ children }: Props) {
  const { view, close: closeOverlay, open: overlayOpen } = useDashboardPageSelector();
  const accountOpen = view === "account";
  const dockHintAttrs = useMobileShellDockHintAttrs();

  return (
    <div
      className={`${MOBILE_SHELL_CLASS} technician-mobile-app`}
      data-mobile-shell
      data-page-selector-open={overlayOpen ? "true" : undefined}
      data-testid="technician-mobile-app"
      {...dockHintAttrs}
    >
      <div
        id="dashboard-overlay-root"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden
      />

      <header className={MOBILE_SHELL_HEADER_CLASS}>
        <MobileProfileTopBar
          topBarTestId={MOBILE_SHELL_CONTRACT.testIds.topBar}
          railTestId="technician-mobile-header-rail"
          profileTestId="technician-mobile-header-profile"
        >
          <TechnicianMobileProfileChip />
        </MobileProfileTopBar>
      </header>

      <div className={`${MOBILE_SHELL_BODY_CLASS} min-h-0 flex-1`}>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              accountOpen && "mobile-screen-host-panel--suspended"
            )}
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
        <MobileCalendarFooterBar
          toggleTarget="calendar"
          footerTestId="technician-mobile-footer-calendar-bar"
          railTestId="technician-mobile-footer-calendar-rail"
          calendarTestId="technician-mobile-footer-calendar"
        />
        <MobileHubDotsBar />
      </footer>
    </div>
  );
}
