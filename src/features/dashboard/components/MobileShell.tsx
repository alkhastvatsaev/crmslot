"use client";

import type { ReactNode } from "react";
import MobileTopBar from "@/features/dashboard/components/MobileTopBar";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import MobileHubDotsBar from "@/features/dashboard/components/MobileHubDotsBar";
import MobileShellFooterDock from "@/features/dashboard/components/MobileShellFooterDock";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { useMobileShellDockHintAttrs } from "@/features/dashboard/MobileDockOnboardingContext";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
  MOBILE_SHELL_BODY_CLASS,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_FOOTER_CLASS,
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";

type Props = { pages: ReactNode[] };

export default function MobileShell({ pages }: Props) {
  const { open: pageSelectorOpen } = useDashboardPageSelector();
  const dockHintAttrs = useMobileShellDockHintAttrs();

  return (
    <MobileHubRailProvider>
      <div
        className={MOBILE_SHELL_CLASS}
        data-mobile-shell
        data-page-selector-open={pageSelectorOpen ? "true" : undefined}
        data-testid="mobile-shell"
        {...dockHintAttrs}
      >
        <div
          id="dashboard-overlay-root"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          aria-hidden
        />

        <header className={MOBILE_SHELL_HEADER_CLASS}>
          <MobileTopBar />
        </header>

        <div className={MOBILE_SHELL_BODY_CLASS}>
          <MobileScreenHost pages={pages} />
        </div>

        <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="mobile-shell-footer">
          <MobileShellSlotGrid
            rootClassName={MOBILE_GALAXY_DOCK_CLASS}
            chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
            data-testid={MOBILE_SHELL_CONTRACT.testIds.galaxyDock}
          >
            <MobileShellFooterDock />
          </MobileShellSlotGrid>
          <MobileHubDotsBar />
        </footer>
      </div>
    </MobileHubRailProvider>
  );
}
