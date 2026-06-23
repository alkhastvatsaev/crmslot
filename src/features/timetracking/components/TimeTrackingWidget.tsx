"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import type { Intervention } from "@/features/interventions";
import { logCrmTimeEntryRecorded } from "@/features/timetracking/logCrmTimeEntryRecorded";
import {
  autoStartTimeEntryType,
  statusTransitionAfterTravelStop,
  statusTransitionForTimeEntryStart,
} from "@/features/timetracking/timeEntryMissionAutomation";
import {
  subscribeTimeEntriesByIntervention,
  startTimeEntry,
  stopTimeEntry,
} from "../timetrackingFirestore";
import {
  TIME_ENTRY_LABELS,
  computeDurationMinutes,
  formatDuration,
  totalDurationByType,
  type TimeEntry,
  type TimeEntryType,
} from "../types";

const TYPES: TimeEntryType[] = ["travel", "on_site", "admin", "break"];

type TimeTrackingIntervention = Pick<
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

type Props = {
  interventionId: string;
  intervention?: TimeTrackingIntervention;
  /** Démarre le chrono, enchaîne statuts et journalise dans Quality Management. */
  automateMissionFlow?: boolean;
  onStatusTransition?: (toStatus: Intervention["status"]) => Promise<void>;
  /** Ouverture automatique de la clôture terrain après arrêt « sur site ». */
  onAfterOnSiteStop?: () => void;
};

export default function TimeTrackingWidget({
  interventionId,
  intervention,
  automateMissionFlow = false,
  onStatusTransition,
  onAfterOnSiteStop,
}: Props) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = workspace?.firebaseUid ?? "";

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeType, setActiveType] = useState<TimeEntryType>("on_site");
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartInFlightRef = useRef(false);
  const autoStartedKeyRef = useRef("");

  useEffect(() => {
    if (!firestore || !companyId) return;
    return subscribeTimeEntriesByIntervention(firestore, companyId, interventionId, (e) => {
      setEntries(e);
      const running = e.find((en) => !en.endedAt);
      setActiveEntry(running ?? null);
    });
  }, [companyId, interventionId]);

  useEffect(() => {
    if (activeEntry) {
      const tick = () => {
        setElapsed(Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeEntry]);

  const runAutoStart = useCallback(async () => {
    if (!automateMissionFlow || !intervention || !firestore || !companyId || !uid || activeEntry) {
      return;
    }

    const entryType = autoStartTimeEntryType(intervention.status, false);
    if (!entryType) return;

    const key = `${interventionId}:${intervention.status}:${entryType}`;
    if (autoStartedKeyRef.current === key || autoStartInFlightRef.current) return;

    autoStartInFlightRef.current = true;
    autoStartedKeyRef.current = key;
    try {
      const transition = statusTransitionForTimeEntryStart(intervention.status, entryType);
      if (transition && onStatusTransition) {
        await onStatusTransition(transition);
      }
      await startTimeEntry(firestore, companyId, uid, entryType, interventionId);
    } catch {
      autoStartedKeyRef.current = "";
      toast.error("Impossible de démarrer le pointage automatique.");
    } finally {
      autoStartInFlightRef.current = false;
    }
  }, [
    activeEntry,
    automateMissionFlow,
    companyId,
    intervention,
    interventionId,
    onStatusTransition,
    uid,
  ]);

  useEffect(() => {
    void runAutoStart();
  }, [runAutoStart]);

  const handleStart = async () => {
    if (!firestore || !companyId || !uid) return;
    if (activeEntry) {
      toast.error("Arrêtez le chrono en cours avant d'en démarrer un nouveau.");
      return;
    }
    try {
      await startTimeEntry(firestore, companyId, uid, activeType, interventionId);
    } catch {
      toast.error("Erreur");
    }
  };

  const handleStop = async () => {
    if (!firestore || !activeEntry) return;

    const stoppedType = activeEntry.type;
    const startedAt = activeEntry.startedAt;
    const endedAt = new Date().toISOString();
    const durationMinutes = computeDurationMinutes(startedAt, endedAt);
    const missionStatus = intervention?.status;

    try {
      await stopTimeEntry(firestore, companyId, activeEntry.id, startedAt);

      if (automateMissionFlow && intervention && uid && durationMinutes > 0) {
        await logCrmTimeEntryRecorded({
          iv: intervention,
          actorUid: uid,
          entryType: stoppedType,
          durationMinutes,
        });
      } else {
        toast.success(`${TIME_ENTRY_LABELS[stoppedType]} enregistré`);
      }

      if (!automateMissionFlow || !intervention) return;

      if (stoppedType === "travel" && missionStatus) {
        const nextStatus = statusTransitionAfterTravelStop(missionStatus);
        if (nextStatus && onStatusTransition) {
          await onStatusTransition(nextStatus);
        }
        autoStartedKeyRef.current = "";
        await startTimeEntry(firestore, companyId, uid, "on_site", interventionId);
        return;
      }

      if (stoppedType === "on_site") {
        onAfterOnSiteStop?.();
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const totals = totalDurationByType(entries.filter((e) => e.durationMinutes));

  return (
    <section data-testid="time-tracking-widget" className="space-y-3">
      {activeEntry ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              {TIME_ENTRY_LABELS[activeEntry.type]}
            </p>
            <p className="text-2xl font-black tabular-nums text-blue-900">
              {String(Math.floor(elapsed / 3600)).padStart(2, "0")}:
              {String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:
              {String(elapsed % 60).padStart(2, "0")}
            </p>
          </div>
          <button
            type="button"
            data-testid="time-stop"
            onClick={() => void handleStop()}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>
      ) : null}

      {!activeEntry && !automateMissionFlow ? (
        <div className="flex gap-2">
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as TimeEntryType)}
            className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TIME_ENTRY_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="button"
            data-testid="time-start"
            onClick={() => void handleStart()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Play className="h-4 w-4" /> Start
          </button>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {TYPES.filter((t) => totals[t] > 0).map((t) => (
            <div key={t} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {TIME_ENTRY_LABELS[t]}
              </p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <Timer className="h-3 w-3 text-slate-400" />
                {formatDuration(totals[t])}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {entries.length === 0 && !activeEntry && !automateMissionFlow ? (
        <p className="text-sm text-slate-400">Aucun pointage pour cette intervention.</p>
      ) : null}
    </section>
  );
}
