"use client";

import { useEffect, useState, useMemo } from "react";
import TechnicianFinishJobPanel from "@/features/interventions/components/TechnicianFinishJobPanel";
import TechnicianMobileDayStrip from "@/features/interventions/components/TechnicianMobileDayStrip";
import TechnicianMobileMissionView from "@/features/interventions/components/TechnicianMobileMissionView";
import { useTechnicianCaseIntent } from "@/context/TechnicianCaseIntentContext";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { TECHNICIAN_HUB_ANCHOR_MISSIONS } from "@/features/interventions/technicianHubNavigation";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { useTechnicianMissionDayAnchor } from "@/features/interventions/useTechnicianMissionDayAnchor";
import {
  interventionVisibleInTechnicianMissionList,
  sortInterventionsByScheduleAsc,
} from "@/features/interventions/technicianSchedule";
import { isTechnicianAssignmentAwaitingResponse } from "@/features/interventions/technicianAssignmentActions";
import InterventionCommandPalette from "@/features/interventions/components/InterventionCommandPalette";
import TechnicianGeofenceWatcher from "@/features/geofence/components/TechnicianGeofenceWatcher";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";

type Props = { slotIndex: number };

/**
 * Hub technicien terrain — une colonne, bandeau missions + écran mission (style Uber).
 */
export default function TechnicianHubPage({ slotIndex }: Props) {
  const { t } = useTranslation();
  const { pendingCaseId, setPendingCaseId } = useTechnicianCaseIntent();
  const { finishJobInterventionId, setFinishJobInterventionId } = useTechnicianFinishJob();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const commandPaletteEnabled = useFeatureFlag("interventionCommandPalette");

  const { interventions, firebaseUid } = useTechnicianAssignments();
  const missionDayAnchor = useTechnicianMissionDayAnchor();
  const { logIntervention } = useActivityLog();

  const selectedFromList = useMemo(
    () => (selectedCaseId ? (interventions.find((x) => x.id === selectedCaseId) ?? null) : null),
    [selectedCaseId, interventions]
  );

  const needsDocListener = Boolean(selectedCaseId && !finishJobInterventionId && !selectedFromList);
  const liveFromSnapshot = useInterventionLive(needsDocListener ? selectedCaseId : null);
  const liveSelectedIntervention = selectedFromList ?? liveFromSnapshot;

  const filteredSorted = useMemo(() => {
    const todayRows = interventions.filter((iv) =>
      interventionVisibleInTechnicianMissionList(iv, "today", firebaseUid, missionDayAnchor)
    );
    const awaiting = todayRows.filter((iv) =>
      isTechnicianAssignmentAwaitingResponse(iv, firebaseUid)
    );
    const rest = todayRows.filter((iv) => !isTechnicianAssignmentAwaitingResponse(iv, firebaseUid));
    return [...sortInterventionsByScheduleAsc(awaiting), ...sortInterventionsByScheduleAsc(rest)];
  }, [interventions, missionDayAnchor, firebaseUid]);

  const activeTodaySorted = useMemo(
    () => filteredSorted.filter((iv) => iv.status !== "done" && iv.status !== "invoiced"),
    [filteredSorted]
  );

  const handleSelectMission = (id: string) => {
    if (finishJobInterventionId && id !== finishJobInterventionId) {
      setFinishJobInterventionId(null);
    }
    setSelectedCaseId(id);
    const iv = interventions.find((x) => x.id === id);
    if (iv) logIntervention(iv);
  };

  useEffect(() => {
    if (finishJobInterventionId) {
      setSelectedCaseId(finishJobInterventionId);
      return;
    }
    if (pendingCaseId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCaseId(pendingCaseId);
      setPendingCaseId(null);
      return;
    }
    setSelectedCaseId((prev) => {
      if (prev) {
        const iv = interventions.find((x) => x.id === prev);
        if (!iv) return activeTodaySorted[0]?.id ?? null;
        if (
          !interventionVisibleInTechnicianMissionList(iv, "today", firebaseUid, missionDayAnchor)
        ) {
          return activeTodaySorted[0]?.id ?? null;
        }
        return prev;
      }
      return activeTodaySorted[0]?.id ?? null;
    });
  }, [
    pendingCaseId,
    setPendingCaseId,
    interventions,
    missionDayAnchor,
    activeTodaySorted,
    firebaseUid,
    finishJobInterventionId,
  ]);

  const centerView = finishJobInterventionId ? "finish" : "detail";

  return (
    <>
      <TechnicianGeofenceWatcher missions={interventions} />
      {commandPaletteEnabled ? (
        <InterventionCommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          missions={filteredSorted}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          onFinishCase={(id) => {
            setSelectedCaseId(id);
            setFinishJobInterventionId(id);
          }}
        />
      ) : null}
      <div
        data-testid={`technician-mobile-hub-${slotIndex}`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
      >
        <TechnicianMobileDayStrip
          missions={filteredSorted}
          selectedId={selectedCaseId}
          onSelect={handleSelectMission}
          t={t}
        />
        <section
          id={TECHNICIAN_HUB_ANCHOR_MISSIONS}
          data-technician-center-view={centerView}
          className="flex min-h-0 flex-1 flex-col overflow-hidden scroll-mt-2"
        >
          {finishJobInterventionId ? (
            <TechnicianFinishJobPanel />
          ) : (
            <TechnicianMobileMissionView
              caseId={selectedCaseId}
              liveIntervention={liveSelectedIntervention}
              technicianUid={firebaseUid}
              onAssignmentAccepted={() => {
                /* reste sur la mission — CTA « Sur place » apparaît */
              }}
              onAssignmentDeclined={() => {
                setSelectedCaseId(null);
              }}
            />
          )}
        </section>
      </div>
    </>
  );
}
