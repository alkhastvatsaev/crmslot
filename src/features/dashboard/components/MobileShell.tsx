"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import MobileTopBar from "@/features/dashboard/components/MobileTopBar";
import MobileScreenHost from "@/features/dashboard/components/MobileScreenHost";
import MobilePageSelector from "@/features/dashboard/components/MobilePageSelector";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
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
  const [selectorOpen, setSelectorOpen] = useState(false);

  return (
    <div className={MOBILE_SHELL_CLASS} data-mobile-shell data-testid="mobile-shell">
      <div
        id="dashboard-overlay-root"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        aria-hidden
      />

      <header className={MOBILE_SHELL_HEADER_CLASS}>
        <MobileTopBar onToggle={() => setSelectorOpen((prev) => !prev)} />
      </header>

      <div className={MOBILE_SHELL_BODY_CLASS} style={{ position: "relative" }}>
        <MobileScreenHost pages={pages} />
        <MobilePageSelector open={selectorOpen} onClose={() => setSelectorOpen(false)} />
      </div>

      <footer className={MOBILE_SHELL_FOOTER_CLASS} data-testid="mobile-shell-footer">
        <div className={MOBILE_GALAXY_DOCK_CLASS} data-testid="mobile-shell-galaxy">
          <div aria-hidden />
          <div className={MOBILE_GALAXY_DOCK_CHROME_CLASS}>
            <DashboardGalaxyLayer />
          </div>
          <div aria-hidden />
        </div>
      </footer>
    </div>
  );
}
