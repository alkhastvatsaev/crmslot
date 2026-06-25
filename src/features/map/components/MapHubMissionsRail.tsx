"use client";

import DailyMissions from "@/features/dashboard/components/DailyMissions";
import type { Mission } from "@/features/map/missionTypes";

type Props = {
  visibleMissions: Mission[];
  onMissionClick: (mission: Mission) => void;
};

/** Rail centre mobile carte — grille missions du jour. */
export default function MapHubMissionsRail({ visibleMissions, onMissionClick }: Props) {
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <DailyMissions missions={visibleMissions} onMissionClick={onMissionClick} isEmbedded />
    </div>
  );
}
