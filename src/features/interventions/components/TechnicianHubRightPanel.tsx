"use client";

import TechnicianCommissionPanel from "@/features/interventions/components/TechnicianCommissionPanel";
import TechnicianDashboardImagesPanel from "@/features/interventions/components/TechnicianDashboardImagesPanel";
import { interventionOpenForTerrainPhotos } from "@/features/interventions/technicianCommissionScope";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians";

type Props = {
  caseId: string | null;
  liveIntervention?: Intervention | null;
  technicianUid: string | null;
  interventions: Intervention[];
  technicians: Technician[];
};

/**
 * Panneau droit terrain : gains du mois par défaut, photos quand une mission est ouverte.
 */
export default function TechnicianHubRightPanel({
  caseId,
  liveIntervention,
  technicianUid,
  interventions,
  technicians,
}: Props) {
  const showMissionPhotos = Boolean(
    caseId && liveIntervention && interventionOpenForTerrainPhotos(liveIntervention)
  );

  if (showMissionPhotos) {
    return <TechnicianDashboardImagesPanel caseId={caseId} liveIntervention={liveIntervention} />;
  }

  return (
    <TechnicianCommissionPanel
      technicianUid={technicianUid}
      interventions={interventions}
      technicians={technicians}
    />
  );
}
