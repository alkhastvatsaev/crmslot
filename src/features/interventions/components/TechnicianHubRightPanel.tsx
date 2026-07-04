"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import TechnicianCommissionPanel from "@/features/interventions/components/TechnicianCommissionPanel";
import TechnicianDashboardImagesPanel from "@/features/interventions/components/TechnicianDashboardImagesPanel";
import { interventionOpenForTerrainPhotos } from "@/features/interventions/technicianCommissionScope";
import type { Intervention } from "@/features/interventions/types";
import { useTechnicians } from "@/features/technicians/hooks";

type Props = {
  caseId: string | null;
  liveIntervention?: Intervention | null;
  technicianUid: string | null;
  interventions: Intervention[];
};

type RightPanelTab = "gains" | "photos";

/**
 * Panneau droit terrain : gains par défaut ; sous-onglets gains/photos si mission ouverte.
 */
export default function TechnicianHubRightPanel({
  caseId,
  liveIntervention,
  technicianUid,
  interventions,
}: Props) {
  const { t } = useTranslation();
  const { technicians } = useTechnicians();
  const showMissionPhotos = Boolean(
    caseId && liveIntervention && interventionOpenForTerrainPhotos(liveIntervention)
  );
  const [tab, setTab] = useState<RightPanelTab>("gains");

  useEffect(() => {
    if (!showMissionPhotos) {
      setTab("gains");
    }
  }, [showMissionPhotos, caseId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {showMissionPhotos ? (
        <div
          className="mobile-rail-segment mx-3 mb-2 mt-2 shrink-0"
          role="tablist"
          aria-label={String(t("technician_hub.aria.right"))}
          data-testid="technician-right-panel-tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "gains"}
            data-testid="technician-right-panel-tab-gains"
            className={cn(
              "mobile-rail-segment-btn",
              tab === "gains" && "mobile-rail-segment-btn--active"
            )}
            onClick={() => setTab("gains")}
          >
            {t("technician_hub.mobile.rail_right")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "photos"}
            data-testid="technician-right-panel-tab-photos"
            className={cn(
              "mobile-rail-segment-btn",
              tab === "photos" && "mobile-rail-segment-btn--active"
            )}
            onClick={() => setTab("photos")}
          >
            {t("technician_hub.mobile.rail_right_photos")}
          </button>
        </div>
      ) : null}

      {tab === "photos" && showMissionPhotos ? (
        <TechnicianDashboardImagesPanel caseId={caseId} liveIntervention={liveIntervention} />
      ) : (
        <TechnicianCommissionPanel
          technicianUid={technicianUid}
          interventions={interventions}
          technicians={technicians}
        />
      )}
    </div>
  );
}
