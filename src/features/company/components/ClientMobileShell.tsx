"use client";

import type { ReactNode } from "react";
import MobileHeaderRailLayout from "@/features/dashboard/components/MobileHeaderRailLayout";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import {
  MOBILE_PROFILE_BAR_CHROME_CLASS,
  MOBILE_PROFILE_BAR_CLASS,
  MOBILE_SHELL_BODY_CLASS,
  MOBILE_SHELL_CLASS,
  MOBILE_SHELL_HEADER_CLASS,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  children: ReactNode;
};

/** Shell portail client — header minimal, pas de carrousel ni Galaxy. */
export default function ClientMobileShell({ children }: Props) {
  return (
    <div
      className={`${MOBILE_SHELL_CLASS} client-mobile-app`}
      data-mobile-shell
      data-testid="client-mobile-app"
    >
      <header className={MOBILE_SHELL_HEADER_CLASS}>
        <MobileShellSlotGrid
          rootClassName={MOBILE_PROFILE_BAR_CLASS}
          chromeClassName={MOBILE_PROFILE_BAR_CHROME_CLASS}
          data-testid="client-mobile-top-bar"
        >
          <MobileHeaderRailLayout
            rootTestId="client-mobile-header-rail"
            leftTestId="client-mobile-header-spacer-left"
            centerTestId="client-mobile-header-title"
            swipeDisabled
            left={<span aria-hidden className="w-full" />}
            center={
              <div className="mobile-header-chip flex h-full w-full items-center justify-center px-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                  Demande
                </span>
              </div>
            }
          />
        </MobileShellSlotGrid>
      </header>

      <div className={`${MOBILE_SHELL_BODY_CLASS} min-h-0 flex-1`}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
