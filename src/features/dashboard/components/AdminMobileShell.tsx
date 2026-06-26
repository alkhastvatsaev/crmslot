"use client";

import type { ReactNode } from "react";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import MobileProfileTopBar from "@/features/dashboard/components/MobileProfileTopBar";
import MobileShellFooterDockRow from "@/features/dashboard/components/MobileShellFooterDockRow";
import AdminMobileProfileChip from "@/features/dashboard/components/AdminMobileProfileChip";
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
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Dock bas Galaxy (`MobileShellFooterDock`). */
  dock?: ReactNode;
};

const accountOverlayClass = cn(
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_SELECTOR_CLASS,
  MOBILE_SHELL_ACCOUNT_OVERLAY_CLASS
);

/**
 * Chrome mobile admin — même grammaire que `MobileShell` / `TechnicianMobileShell` :
 * profil en haut · panneaux centraux (children) · calendrier OU Galaxy en bas.
 */
export default function AdminMobileShell({ children, dock }: Props) {
  const { view, close: closeOverlay, open: overlayOpen } = useDashboardPageSelector();
  const accountOpen = view === "account";
  const dockHintAttrs = useMobileShellDockHintAttrs();

  return (
    <div
      className={`${MOBILE_SHELL_CLASS} admin-mobile-app`}
      data-mobile-shell
      data-page-selector-open={overlayOpen ? "true" : undefined}
      data-testid="admin-mobile-app"
      {...dockHintAttrs}
    >
      <div
        id="dashboard-overlay-root"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden
      />

      <header className={MOBILE_SHELL_HEADER_CLASS}>
        <MobileProfileTopBar
          railTestId="admin-mobile-header-rail"
          profileTestId="admin-mobile-header-profile"
        >
          <AdminMobileProfileChip />
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

      <MobileShellFooterDockRow
        dock={dock}
        galaxyDockTestId="admin-mobile-shell-dock"
        footerTestId="admin-mobile-shell-footer"
        calendar={{
          toggleTarget: "calendar",
          calendarBarTestId: "admin-mobile-footer-calendar-bar",
          railTestId: "admin-mobile-footer-calendar-rail",
          calendarTestId: "admin-mobile-footer-calendar",
        }}
      />
    </div>
  );
}
