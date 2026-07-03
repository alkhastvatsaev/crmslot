"use client";

import { useMemo } from "react";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

export type MobileInboxTab = "chat" | "requests" | "reports";

export type MobileMapPagePowerGate = {
  /** Page carte (index 0) visible à l'écran mobile. */
  mapPageVisible: boolean;
  /** Firestore missions / marqueurs : rails gauche ou centre. */
  mapHubDataActive: boolean;
  /** WebGL carte : rail gauche (panneau Mapbox). */
  mapRenderDataActive: boolean;
  /** Inbox back-office : rail droit. */
  inboxDataActive: boolean;
};

export function useMobileMapPagePowerGate(): MobileMapPagePowerGate {
  const isMobile = useIsMobile();
  const pager = useDashboardPagerOptional();
  const railSnapshot = useMobileHubRailSnapshot();

  return useMemo(() => {
    if (isMobile !== true) {
      return {
        mapPageVisible: true,
        mapHubDataActive: true,
        mapRenderDataActive: true,
        inboxDataActive: true,
      };
    }

    const mapPageVisible = pager?.pageIndex === 0 && railSnapshot?.visible !== false;
    const activeRail = railSnapshot?.activeRail;

    return {
      mapPageVisible,
      mapHubDataActive: mapPageVisible && (activeRail === "left" || activeRail === "center"),
      mapRenderDataActive: mapPageVisible && activeRail === "left",
      inboxDataActive: mapPageVisible && activeRail === "right",
    };
  }, [isMobile, pager?.pageIndex, railSnapshot?.activeRail, railSnapshot?.visible]);
}
