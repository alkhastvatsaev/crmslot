"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildMapHubMissions } from "@/features/map/mapMissionTransforms";
import { useDateContext } from "@/context/DateContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { useMapArchivedMissions } from "@/features/map/useMapArchivedMissions";
import { missionStableKey } from "@/features/map/missionStableKey";
import type { Mission } from "@/features/map/missionTypes";
import { useFirestoreLiveEnabled } from "@/core/perf/useFirestoreLiveEnabled";
import { doc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { toast } from "sonner";

type Options = {
  mapHubDataActive?: boolean;
};

export function useMapHubMissions({ mapHubDataActive = true }: Options = {}) {
  const workspace = useCompanyWorkspaceOptional();
  const isDispatchMap = isCompanyDispatchViewer(workspace);
  const inboxIntent = useBackofficeInboxIntentOptional();
  const galaxyBridge = useGalaxyLayerBridgeOptional();
  const { t } = useTranslation();
  const { archivedKeys, archiveKey } = useMapArchivedMissions();
  const { selectedDate } = useDateContext();
  const missionsLive = useFirestoreLiveEnabled(mapHubDataActive);

  const { interventions: boInterventions } = useBackOfficeInterventions(
    isDispatchMap && missionsLive ? (workspace?.activeCompanyId ?? null) : null,
    { enabled: missionsLive }
  );
  const { interventions: techInterventions, firebaseUid: technicianUid } = useTechnicianAssignments(
    {
      enabled: !isDispatchMap && missionsLive,
    }
  );

  const firestoreInterventions = isDispatchMap ? boInterventions : techInterventions;
  const [liveMissions, setLiveMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const selectedDateStr = useMemo(() => selectedDate.toLocaleDateString("en-CA"), [selectedDate]);

  const allMissions = useMemo(
    () =>
      buildMapHubMissions({
        firestoreInterventions,
        liveMissions,
        selectedDateStr,
        selectedDate,
        isDispatchMap,
        technicianUid,
        clientLabel: (key) => String(t(key)),
      }),
    [
      firestoreInterventions,
      liveMissions,
      selectedDateStr,
      selectedDate,
      isDispatchMap,
      technicianUid,
      t,
    ]
  );

  const visibleMissions = useMemo(
    () => allMissions.filter((m) => !archivedKeys.has(missionStableKey(m))),
    [allMissions, archivedKeys]
  );

  const visibleInterventions = useMemo(() => {
    const keys = new Set(visibleMissions.map((m) => m.key).filter(Boolean));
    return firestoreInterventions.filter((iv) => keys.has(iv.id));
  }, [firestoreInterventions, visibleMissions]);

  useEffect(() => {
    if (!galaxyBridge) return;
    galaxyBridge.registerInterventionConsumer((m) => {
      setLiveMissions((prev) => [
        { ...m, source: "live", date: m.date || selectedDateStr },
        ...prev.filter((x) => (x.key ?? String(x.id)) !== m.key),
      ]);
    });
    return () => galaxyBridge.registerInterventionConsumer(null);
  }, [galaxyBridge, selectedDateStr]);

  const handleArchiveMission = useCallback(
    (mission: Mission) => {
      archiveKey(missionStableKey(mission));
      setSelectedMission((prev) =>
        prev && missionStableKey(prev) === missionStableKey(mission) ? null : prev
      );
      toast.success(String(t("map.daily_missions.archived_toast")));
    },
    [archiveKey, t]
  );

  const handleDeleteMission = useCallback(
    async (mission: Mission) => {
      const ok = window.confirm(String(t("map.daily_missions.delete_confirm")));
      if (!ok) return;

      if (mission.key && firestore) {
        try {
          await deleteDoc(doc(firestore, "interventions", mission.key));
          toast.success(String(t("map.daily_missions.deleted_toast")));
          setSelectedMission(null);
        } catch {
          toast.error("Erreur de suppression");
        }
      } else {
        archiveKey(missionStableKey(mission));
        setSelectedMission(null);
        toast.success(String(t("map.daily_missions.deleted_toast")));
      }
    },
    [archiveKey, t]
  );

  const handleMissionClick = useCallback(
    (mission: Mission) => {
      setSelectedMission(mission);
      if (inboxIntent) {
        inboxIntent.setPendingChatInterventionId(missionStableKey(mission));
      }
    },
    [inboxIntent]
  );

  return {
    isDispatchMap,
    visibleMissions,
    visibleInterventions,
    selectedMission,
    setSelectedMission,
    handleArchiveMission,
    handleDeleteMission,
    handleMissionClick,
  };
}
