"use client";

import type { ReactNode } from "react";
import { useMobilePanelMotionReady } from "@/features/dashboard/hooks/useMobilePanelMotionReady";
import type { MobileScreenHostPanelPhase } from "@/features/dashboard/mobilePageTransition";
import {
  MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
  MOBILE_SCREEN_HOST_PANEL_CLASS,
  MOBILE_SCREEN_HOST_PANEL_MOTION_RUN_CLASS,
  MOBILE_SCREEN_HOST_PANEL_PHASE_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  phase: MobileScreenHostPanelPhase;
  children: ReactNode;
};

export default function MobileScreenHostPanel({ index, phase, children }: Props) {
  const motionRun = useMobilePanelMotionReady(phase);
  const isEnter = phase === "enter-next" || phase === "enter-prev";
  const hidden = phase === "suspended" || phase === "exit-next" || phase === "exit-prev";
  const inert = phase !== "active";

  return (
    <div
      className={cn(
        MOBILE_SCREEN_HOST_PANEL_CLASS,
        MOBILE_SCREEN_HOST_PANEL_BASE_CLASS,
        MOBILE_SCREEN_HOST_PANEL_PHASE_CLASS[phase],
        isEnter && motionRun && MOBILE_SCREEN_HOST_PANEL_MOTION_RUN_CLASS
      )}
      aria-hidden={hidden}
      inert={inert ? true : undefined}
      data-testid={`mobile-page-${index}`}
      data-mobile-page-phase={phase}
    >
      {children}
    </div>
  );
}
