"use client";

import { useEffect, useMemo } from "react";
import type {
  BridgedTechnicianReport,
  TechnicianBackofficeReportBridgeApi,
} from "@/context/TechnicianBackofficeReportBridgeContext";
import {
  mergeReportCompletionMedia,
  pickLatestBridgedReportForIntervention,
  shouldDismissBridgedTerrainReport,
} from "@/features/backoffice/mergeReportCompletionMedia";
import { isInterventionInBackofficeRequestsQueue } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions";

type TerrainBridgeArgs = {
  interventions: Intervention[];
  bridgedTerrainReports: BridgedTechnicianReport[];
  terrainBridge: TechnicianBackofficeReportBridgeApi | null;
  selectedItem: Intervention | null;
  selectedTerrainLocalId: string | null;
  setSelectedTerrainLocalId: (id: string | null) => void;
};

export function useBackOfficeInboxTerrainBridge({
  interventions,
  bridgedTerrainReports,
  terrainBridge,
  selectedItem,
  selectedTerrainLocalId,
  setSelectedTerrainLocalId,
}: TerrainBridgeArgs) {
  const selectedReportCompletion = useMemo(() => {
    if (!selectedItem) return { photoUrls: [] as string[], signatureUrl: null as string | null };
    if (isInterventionInBackofficeRequestsQueue(selectedItem)) {
      return { photoUrls: [], signatureUrl: null };
    }
    const bridged = pickLatestBridgedReportForIntervention(bridgedTerrainReports, selectedItem.id);
    return mergeReportCompletionMedia(selectedItem, bridged);
  }, [selectedItem, bridgedTerrainReports]);

  const terrainIv = useMemo(() => {
    if (!selectedTerrainLocalId) return null;
    const r = bridgedTerrainReports.find((x) => x.localId === selectedTerrainLocalId);
    if (!r) return null;
    return interventions.find((x) => x.id === r.interventionId) ?? null;
  }, [selectedTerrainLocalId, bridgedTerrainReports, interventions]);

  useEffect(() => {
    if (!terrainBridge) return;
    bridgedTerrainReports.forEach((r) => {
      const iv = interventions.find((x) => x.id === r.interventionId);
      if (shouldDismissBridgedTerrainReport(iv)) {
        terrainBridge.dismissReport(r.localId);
      }
    });
  }, [bridgedTerrainReports, interventions, terrainBridge]);

  useEffect(() => {
    if (!selectedTerrainLocalId) return;
    if (!bridgedTerrainReports.some((r) => r.localId === selectedTerrainLocalId)) {
      setSelectedTerrainLocalId(null);
    }
  }, [selectedTerrainLocalId, bridgedTerrainReports, setSelectedTerrainLocalId]);

  return { selectedReportCompletion, terrainIv };
}
