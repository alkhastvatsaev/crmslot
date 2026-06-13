"use client";

import { useCallback, useEffect, useRef } from "react";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";
import { logCrmTimeEntryRecorded } from "@/features/timetracking/logCrmTimeEntryRecorded";
import {
  startTimeEntry,
  stopTimeEntry,
  subscribeTimeEntriesByIntervention,
} from "@/features/timetracking/timetrackingFirestore";
import {
  computeDurationMinutes,
  type TimeEntry,
  type TimeEntryType,
} from "@/features/timetracking/types";

export type MissionTimeTrackingIntervention = Pick<
  Intervention,
  | "id"
  | "status"
  | "title"
  | "companyId"
  | "clientName"
  | "clientFirstName"
  | "clientLastName"
  | "clientCompanyName"
  | "address"
>;

const STATUS_TIME_TYPE: Partial<Record<Intervention["status"], TimeEntryType>> = {
  en_route: "travel",
  in_progress: "on_site",
};

type Params = {
  enabled: boolean;
  intervention: MissionTimeTrackingIntervention | null | undefined;
  technicianUid?: string;
};

/** Pointage silencieux : démarre/arrête les entrées selon le statut mission + journal CRM. */
export function useMissionTimeTrackingAutomation({ enabled, intervention, technicianUid }: Params) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = technicianUid?.trim() || workspace?.firebaseUid?.trim() || "";

  const activeEntryRef = useRef<TimeEntry | null>(null);
  const syncInFlightRef = useRef(false);
  const lastSyncedStatusRef = useRef<string>("");

  useEffect(() => {
    activeEntryRef.current = null;
    lastSyncedStatusRef.current = "";
    if (!enabled || !intervention?.id || !firestore || !companyId) return;

    return subscribeTimeEntriesByIntervention(firestore, companyId, intervention.id, (entries) => {
      activeEntryRef.current = entries.find((entry) => !entry.endedAt) ?? null;
    });
  }, [companyId, enabled, intervention?.id]);

  const stopAndLog = useCallback(
    async (entry: TimeEntry, iv: MissionTimeTrackingIntervention) => {
      if (!firestore || !companyId || !uid) return;

      const durationMinutes = computeDurationMinutes(entry.startedAt, new Date().toISOString());
      await stopTimeEntry(firestore, companyId, entry.id, entry.startedAt);

      if (durationMinutes > 0) {
        await logCrmTimeEntryRecorded({
          iv,
          actorUid: uid,
          entryType: entry.type,
          durationMinutes,
        });
      }
    },
    [companyId, uid]
  );

  const syncForStatus = useCallback(
    async (iv: MissionTimeTrackingIntervention) => {
      if (!firestore || !companyId || !uid || syncInFlightRef.current) return;

      const statusKey = `${iv.id}:${iv.status}`;
      const expectedType = STATUS_TIME_TYPE[iv.status];
      const running = activeEntryRef.current;

      if (!expectedType) {
        if (!running) {
          lastSyncedStatusRef.current = statusKey;
          return;
        }
      } else if (running?.type === expectedType) {
        lastSyncedStatusRef.current = statusKey;
        return;
      }

      if (lastSyncedStatusRef.current === statusKey && !running) return;

      syncInFlightRef.current = true;
      try {
        if (running) {
          await stopAndLog(running, iv);
          activeEntryRef.current = null;
        }
        if (expectedType) {
          await startTimeEntry(firestore, companyId, uid, expectedType, iv.id);
        }
        lastSyncedStatusRef.current = statusKey;
      } catch (error) {
        lastSyncedStatusRef.current = "";
        logger.warn("[useMissionTimeTrackingAutomation]", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [companyId, stopAndLog, uid]
  );

  useEffect(() => {
    if (!enabled || !intervention?.id) return;
    void syncForStatus(intervention);
  }, [enabled, intervention, syncForStatus]);

  const flushActiveTimeEntry = useCallback(async () => {
    if (!intervention?.id) return;
    const running = activeEntryRef.current;
    if (!running) return;
    await stopAndLog(running, intervention);
    activeEntryRef.current = null;
    lastSyncedStatusRef.current = "";
  }, [intervention, stopAndLog]);

  return { flushActiveTimeEntry };
}
