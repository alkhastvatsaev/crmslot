"use client";

import type { ReactNode } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import BackOfficeInboxPanel from "@/features/backoffice/components/BackOfficeInboxPanel";
import MapHubMissionsRail from "@/features/map/components/MapHubMissionsRail";
import type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";
import type { Mission } from "@/features/map/missionTypes";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  mapRail: ReactNode;
  visibleMissions: Mission[];
  inboxDataActive: boolean;
  onMissionClick: (mission: Mission) => void;
  onRailChange?: (rail: MobileHubRail) => void;
};

/**
 * Page carte mobile — même pont `AdaptiveTriplePanelLayout` que les autres hubs.
 * Mobile : gauche = carte · centre = missions · droite = inbox.
 */
export default function MapHubMobileTripleLayout({
  mapRail,
  visibleMissions,
  inboxDataActive,
  onMissionClick,
  onRailChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <AdaptiveTriplePanelLayout
      rootTestId="mobile-map-triple"
      leftAriaLabel={String(t("map.mobile.rail_map"))}
      centerAriaLabel={String(t("map.mobile.rail_missions"))}
      rightAriaLabel={String(t("map.mobile.rail_inbox"))}
      mobileLeftLabel={String(t("map.mobile.rail_map"))}
      mobileCenterLabel={String(t("map.mobile.rail_missions"))}
      mobileRightLabel={String(t("map.mobile.rail_inbox"))}
      centerPadding={false}
      rightPadding={false}
      mobileSideScroll={false}
      mobileInitialRail="right"
      onRailChange={onRailChange}
      left={mapRail}
      center={
        <MapHubMissionsRail visibleMissions={visibleMissions} onMissionClick={onMissionClick} />
      }
      right={
        <BackOfficeInboxPanel dayMissions={visibleMissions} inboxDataActive={inboxDataActive} />
      }
    />
  );
}
