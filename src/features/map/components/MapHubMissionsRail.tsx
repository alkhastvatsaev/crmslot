"use client";

import { AnimatePresence } from "framer-motion";
import DailyMissions from "@/features/dashboard/components/DailyMissions";
import MapMissionSelectedOverlay from "@/features/map/components/MapMissionSelectedOverlay";
import type { Mission } from "@/features/map/missionTypes";

type Props = {
  visibleMissions: Mission[];
  selectedMission: Mission | null;
  onMissionClick: (mission: Mission) => void;
  onCloseMission: () => void;
  onArchiveMission: (mission: Mission) => void;
  onDeleteMission: (mission: Mission) => void;
  onViewOnMap?: (mission: Mission) => void;
};

/** Rail centre mobile carte — grille missions + overlay détail. */
export default function MapHubMissionsRail({
  visibleMissions,
  selectedMission,
  onMissionClick,
  onCloseMission,
  onArchiveMission,
  onDeleteMission,
  onViewOnMap,
}: Props) {
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <DailyMissions missions={visibleMissions} onMissionClick={onMissionClick} isEmbedded />
      <AnimatePresence>
        {selectedMission ? (
          <MapMissionSelectedOverlay
            mission={selectedMission}
            onClose={onCloseMission}
            onArchive={onArchiveMission}
            onDelete={onDeleteMission}
            onViewOnMap={onViewOnMap}
            variant="compact"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
