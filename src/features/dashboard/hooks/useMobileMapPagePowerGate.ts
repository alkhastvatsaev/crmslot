"use client";

import { useMemo } from "react";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

export type MobileInboxTab = "chat" | "requests" | "reports" | "documents";

export type MobileMapPagePowerGate = {
  /** Page carte (index 0) visible à l'écran mobile. */
  mapPageVisible: boolean;
  /** Firestore missions / marqueurs : rails gauche ou centre. */
  mapHubDataActive: boolean;
  /** WebGL carte : rail gauche (panneau Mapbox). */
  mapRenderDataActive: boolean;
  /** Inbox back-office : rail droit. */
  inboxDataActive: boolean;
  /** Onglet Documents actif dans l'inbox. */
  documentsTabActive: boolean;
};

export function useMobileMapPagePowerGate(
  activeInboxTab: MobileInboxTab | null | undefined
): MobileMapPagePowerGate {
  const isMobile = useIsMobile();
  const pager = useDashboardPagerOptional();
  const railSnapshot = useMobileHubRailSnapshot();

  return useMemo(() => {
    const documentsTabActive = activeInboxTab === "documents";

    if (isMobile !== true) {
      return {
        mapPageVisible: true,
        mapHubDataActive: true,
        mapRenderDataActive: true,
        inboxDataActive: true,
        documentsTabActive,
      };
    }

    const mapPageVisible = pager?.pageIndex === 0 && railSnapshot?.visible !== false;
    const activeRail = railSnapshot?.activeRail;

    return {
      mapPageVisible,
      mapHubDataActive: mapPageVisible && (activeRail === "left" || activeRail === "center"),
      mapRenderDataActive: mapPageVisible && activeRail === "left",
      inboxDataActive: mapPageVisible && activeRail === "right",
      documentsTabActive,
    };
  }, [activeInboxTab, isMobile, pager?.pageIndex, railSnapshot?.activeRail, railSnapshot?.visible]);
}
