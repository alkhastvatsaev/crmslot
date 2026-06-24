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
  selectedMission: Mission | null;
  inboxDataActive: boolean;
  onMissionClick: (mission: Mission) => void;
  onCloseMission: () => void;
  onArchiveMission: (mission: Mission) => void;
  onDeleteMission: (mission: Mission) => void;
  onViewOnMap?: (mission: Mission) => void;
  onRailChange?: (rail: MobileHubRail) => void;
};

/**
 * Page carte mobile — même pont `AdaptiveTriplePanelLayout` que les autres hubs.
 * Mobile : gauche = carte · centre = missions · droite = inbox.
 */
export default function MapHubMobileTripleLayout({
  mapRail,
  visibleMissions,
  selectedMission,
  inboxDataActive,
  onMissionClick,
  onCloseMission,
  onArchiveMission,
  onDeleteMission,
  onViewOnMap,
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
        <MapHubMissionsRail
          visibleMissions={visibleMissions}
          selectedMission={selectedMission}
          onMissionClick={onMissionClick}
          onCloseMission={onCloseMission}
          onArchiveMission={onArchiveMission}
          onDeleteMission={onDeleteMission}
          onViewOnMap={onViewOnMap}
        />
      }
      right={
        <BackOfficeInboxPanel dayMissions={visibleMissions} inboxDataActive={inboxDataActive} />
      }
    />
  );
}
