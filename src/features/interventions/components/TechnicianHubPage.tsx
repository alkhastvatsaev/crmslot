"use client";

import { useEffect, useState, useMemo } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import TechnicianDashboardDetailPanel from "@/features/interventions/components/TechnicianDashboardDetailPanel";
import TechnicianFinishJobPanel from "@/features/interventions/components/TechnicianFinishJobPanel";
import TechnicianDashboardImagesPanel from "@/features/interventions/components/TechnicianDashboardImagesPanel";
import DailyMissions from "@/features/dashboard/components/DailyMissions";
import type { Mission } from "@/features/map/missionTypes";
import { useTechnicianCaseIntent } from "@/context/TechnicianCaseIntentContext";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
  TECHNICIAN_HUB_ANCHOR_FINISH,
} from "@/features/interventions/technicianHubNavigation";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { useTechnicianMissionDayAnchor } from "@/features/interventions/useTechnicianMissionDayAnchor";
import {
  interventionVisibleInTechnicianMissionList,
  sortInterventionsByScheduleAsc,
  interventionClientLabel,
  statusLabelKey,
  formatScheduledTimeOnly,
} from "@/features/interventions/technicianSchedule";
import { isTechnicianAssignmentAwaitingResponse } from "@/features/interventions/technicianAssignmentActions";
import InterventionCommandPalette from "@/features/interventions/components/InterventionCommandPalette";
import TechnicianGeofenceWatcher from "@/features/geofence/components/TechnicianGeofenceWatcher";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";

type Props = { slotIndex: number };

/**
 * Une page carrousel = tout le poste **technicien** : Ma Journée (gauche), missions (centre),
 * photos client (droite).
 */
export default function TechnicianHubPage({ slotIndex }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const { pendingCaseId, setPendingCaseId } = useTechnicianCaseIntent();
  const { finishJobInterventionId, setFinishJobInterventionId } = useTechnicianFinishJob();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const requestMobileHubRail = useRequestMobileHubRail();
  const [commandOpen, setCommandOpen] = useState(false);
  const commandPaletteEnabled = useFeatureFlag("interventionCommandPalette");

  const { interventions, firebaseUid } = useTechnicianAssignments();
  const missionDayAnchor = useTechnicianMissionDayAnchor();
  const { logIntervention } = useActivityLog();

  const selectedFromList = useMemo(
    () => (selectedCaseId ? (interventions.find((x) => x.id === selectedCaseId) ?? null) : null),
    [selectedCaseId, interventions]
  );

  /** Pas de 2e listener doc si la mission est déjà dans la query assignée (réduit race Firestore ca9). */
  const needsDocListener = Boolean(selectedCaseId && !finishJobInterventionId && !selectedFromList);
  const liveFromSnapshot = useInterventionLive(needsDocListener ? selectedCaseId : null);

  const liveSelectedIntervention = selectedFromList ?? liveFromSnapshot;

  /** Même filtre « aujourd’hui » que la liste gauche (sélection auto du 1er dossier du jour). */
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

  /** Ne pas auto-sélectionner une mission déjà en archives (évite détail « clôturée » + photos sans clic explicite). */
  const activeTodaySorted = useMemo(
    () => filteredSorted.filter((iv) => iv.status !== "done" && iv.status !== "invoiced"),
    [filteredSorted]
  );

  const todayMissions = useMemo<Mission[]>(
    () =>
      sortInterventionsByScheduleAsc(filteredSorted).map((iv, index) => ({
        id: index,
        key: iv.id,
        clientName: interventionClientLabel(iv) || String(t("common.client")),
        coordinates: [0, 0] as [number, number],
        time: formatScheduledTimeOnly(iv),
        status: String(t(statusLabelKey(iv.status))),
        statusCode: iv.status,
      })),
    [filteredSorted, t]
  );

  const handleMissionClick = (mission: Mission) => {
    if (!mission.key) return;
    requestMobileHubRail("center");
    if (finishJobInterventionId && mission.key !== finishJobInterventionId) {
      setFinishJobInterventionId(null);
    }
    setSelectedCaseId(mission.key);
    const iv = interventions.find((x) => x.id === mission.key);
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

  const leftPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DailyMissions missions={todayMissions} onMissionClick={handleMissionClick} isEmbedded />
    </div>
  );

  const centerPanel = (
    <section
      id={TECHNICIAN_HUB_ANCHOR_MISSIONS}
      data-technician-center-view={centerView}
      className="flex min-h-0 flex-1 flex-col overflow-hidden scroll-mt-2"
    >
      {finishJobInterventionId ? (
        <TechnicianFinishJobPanel />
      ) : (
        <TechnicianDashboardDetailPanel
          caseId={selectedCaseId}
          liveIntervention={liveSelectedIntervention}
          technicianUid={firebaseUid}
        />
      )}
    </section>
  );

  const rightPanel = (
    <div
      id={TECHNICIAN_HUB_ANCHOR_FINISH}
      className="scroll-mt-2 flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <TechnicianDashboardImagesPanel caseId={selectedCaseId} />
    </div>
  );

  const layoutLabels = {
    left: `${t("technician_hub.aria.page")} ${humanPage} — ${t("technician_hub.aria.left")}`,
    center: `${t("technician_hub.aria.page")} ${humanPage} — ${t("technician_hub.aria.center")}`,
    right: `${t("technician_hub.aria.page")} ${humanPage} — ${t("technician_hub.aria.right")}`,
  };

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
      <AdaptiveTriplePanelLayout
        rootTestId={`dashboard-pager-slot-${slotIndex}`}
        leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
        centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
        rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
        leftAriaLabel={layoutLabels.left}
        centerAriaLabel={layoutLabels.center}
        rightAriaLabel={layoutLabels.right}
        left={leftPanel}
        center={centerPanel}
        right={rightPanel}
        centerPadding={false}
      />
    </>
  );
}
