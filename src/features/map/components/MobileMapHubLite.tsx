"use client";

import { useCallback } from "react";
import MobileMapWebGLPlaceholder from "@/features/map/components/MobileMapWebGLPlaceholder";
import MapHubMobileTripleLayout from "@/features/map/components/MapHubMobileTripleLayout";
import { useMapHubMissions } from "@/features/map/hooks/useMapHubMissions";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import type { Mission } from "@/features/map/missionTypes";

/**
 * Hub carte mobile sans Mapbox — évite le chargement du bundle WebGL (test batterie / perf).
 * Réactiver la carte via feature flag `mobileMapWebGL` (mode ultra).
 */
export default function MobileMapHubLite() {
  const inboxIntent = useBackofficeInboxIntentOptional();
  const requestMobileHubRail = useRequestMobileHubRail();
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const mapHubDataActive = powerGate.mapHubDataActive;

  const {
    visibleMissions,
    selectedMission,
    setSelectedMission,
    handleArchiveMission,
    handleDeleteMission,
    handleMissionClick,
  } = useMapHubMissions({ mapHubDataActive });

  const handleViewMissionOnMap = useCallback(
    (_mission: Mission) => {
      requestMobileHubRail("left");
      setSelectedMission(null);
    },
    [requestMobileHubRail, setSelectedMission]
  );

  return (
    <MapHubMobileTripleLayout
      mapRail={
        <div id="map-container" className="relative flex h-full min-h-0 flex-col">
          <MobileMapWebGLPlaceholder
            missions={visibleMissions}
            onMissionClick={handleMissionClick}
          />
        </div>
      }
      visibleMissions={visibleMissions}
      selectedMission={selectedMission}
      inboxDataActive={powerGate.inboxDataActive}
      onMissionClick={handleMissionClick}
      onCloseMission={() => setSelectedMission(null)}
      onArchiveMission={handleArchiveMission}
      onDeleteMission={handleDeleteMission}
      onViewOnMap={handleViewMissionOnMap}
    />
  );
}
