"use client";

import type { ReactNode } from "react";
import MobileShellSlotGrid from "@/features/dashboard/components/MobileShellSlotGrid";
import { useMobileFooterGalaxyVisible } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import {
  MOBILE_GALAXY_DOCK_CHROME_CLASS,
  MOBILE_GALAXY_DOCK_CLASS,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  children: ReactNode;
  testId?: string;
};

/** Dock Galaxy (saisie / hub) — masqué quand inactif pour ne pas laisser de bande vide sous le calendrier. */
export default function MobileShellGalaxyDockSlot({
  children,
  testId = MOBILE_SHELL_CONTRACT.testIds.galaxyDock,
}: Props) {
  const visible = useMobileFooterGalaxyVisible();
  if (!visible) return null;

  return (
    <MobileShellSlotGrid
      rootClassName={MOBILE_GALAXY_DOCK_CLASS}
      chromeClassName={MOBILE_GALAXY_DOCK_CHROME_CLASS}
      data-testid={testId}
    >
      {children}
    </MobileShellSlotGrid>
  );
}
