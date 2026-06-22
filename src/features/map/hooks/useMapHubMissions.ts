"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useDateContext } from "@/context/DateContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import {
  interventionClientLabel,
  statusLabelKey,
  formatScheduledTimeOnly,
  interventionMatchesTab,
  interventionVisibleInTechnicianMissionList,
  isInterventionReleasedToTechnicianField,
  isInterventionVisibleOnTechnicianMap,
} from "@/features/interventions/technicianSchedule";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { useMapArchivedMissions } from "@/features/map/useMapArchivedMissions";
import { missionStableKey } from "@/features/map/missionStableKey";
import type { Mission } from "@/features/map/missionTypes";
import type { Intervention } from "@/features/interventions/types";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import { useFirestoreLiveEnabled } from "@/core/perf/useFirestoreLiveEnabled";

function interventionHasMapCoordinates(iv: Intervention): boolean {
  const loc = iv.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return false;
  return Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
}

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
  const requestMobileHubRail = useRequestMobileHubRail();
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

  const allMissions = useMemo(() => {
    const liveForDay = liveMissions.filter((m) => !m.date || m.date === selectedDateStr);

    const realMissions: Mission[] = firestoreInterventions
      .filter((iv) =>
        isDispatchMap
          ? isInterventionReleasedToTechnicianField(iv)
          : isInterventionVisibleOnTechnicianMap(iv)
      )
      .filter((iv) =>
        isDispatchMap
          ? interventionMatchesTab(iv, "today", selectedDate)
          : interventionVisibleInTechnicianMissionList(iv, "today", technicianUid, selectedDate)
      )
      .filter(interventionHasMapCoordinates)
      .map((iv) => {
        let numericId = 0;
        for (let i = 0; i < iv.id.length; i++) {
          numericId = (numericId << 5) - numericId + iv.id.charCodeAt(i);
          numericId |= 0;
        }
        return {
          id: Math.abs(numericId),
          key: iv.id,
          clientName: interventionClientLabel(iv) || String(t("common.client")),
          coordinates: [iv.location.lng, iv.location.lat] as [number, number],
          time: formatScheduledTimeOnly(iv),
          status: String(t(statusLabelKey(iv.status))),
          statusCode: iv.status,
          source: "live" as const,
          date: iv.scheduledDate || selectedDateStr,
          phone: iv.clientPhone || iv.phone || undefined,
          address: iv.address || undefined,
          description: iv.problem || iv.transcription || undefined,
        };
      });

    const all = [...realMissions, ...liveForDay];
    const unique = new Map<string | number, Mission>();
    all.forEach((m) => {
      const key = m.key ?? m.id;
      if (!unique.has(key)) unique.set(key, m);
    });
    const deduped = Array.from(unique.values());

    const score = (time: string) => {
      if (!time) return 9999;
      if (time === "Maintenant") return -1;
      const raw = time.trim();
      const last = raw.split(/\s+/).pop() || raw;
      const m = /^(\d{2}):(\d{2})$/.exec(last);
      if (!m) return 9999;
      return Number(m[1]) * 60 + Number(m[2]);
    };
    return [...deduped].sort((a, b) => score(a.time) - score(b.time));
  }, [
    liveMissions,
    firestoreInterventions,
    selectedDateStr,
    selectedDate,
    isDispatchMap,
    technicianUid,
    t,
  ]);

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
      requestMobileHubRail("center");
      if (inboxIntent) {
        inboxIntent.setPendingChatInterventionId(missionStableKey(mission));
      }
    },
    [inboxIntent, requestMobileHubRail]
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
