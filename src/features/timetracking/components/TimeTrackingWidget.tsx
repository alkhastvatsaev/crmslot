"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, Play, Square, Clock } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeTimeEntriesByIntervention,
  startTimeEntry,
  stopTimeEntry,
} from "../timetrackingFirestore";
import {
  TIME_ENTRY_LABELS,
  formatDuration,
  totalDurationByType,
  type TimeEntry,
  type TimeEntryType,
} from "../types";

const TYPES: TimeEntryType[] = ["travel", "on_site", "admin", "break"];

export default function TimeTrackingWidget({ interventionId }: { interventionId: string }) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = workspace?.firebaseUid ?? "";

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeType, setActiveType] = useState<TimeEntryType>("on_site");
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeEntry]);

  const handleStart = async () => {
    if (!firestore || !companyId || !uid) return;
    if (activeEntry) {
      toast.error("Arrêtez le chrono en cours avant d'en démarrer un nouveau.");
      return;
    }
    try {
      await startTimeEntry(firestore, companyId, uid, activeType, interventionId);
    } catch { toast.error("Erreur"); }
  };

  const handleStop = async () => {
    if (!firestore || !activeEntry) return;
    try {
      await stopTimeEntry(firestore, companyId, activeEntry.id, activeEntry.startedAt);
      toast.success(`${TIME_ENTRY_LABELS[activeEntry.type]} enregistré`);
    } catch { toast.error("Erreur"); }
  };

  const totals = totalDurationByType(entries.filter((e) => e.durationMinutes));

  return (
    <section data-testid="time-tracking-widget" className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">Time tracking</h3>
      </div>

      {/* Timer display */}
      {activeEntry && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">{TIME_ENTRY_LABELS[activeEntry.type]}</p>
            <p className="text-2xl font-black tabular-nums text-blue-900">
              {String(Math.floor(elapsed / 3600)).padStart(2, "0")}:
              {String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")}:
              {String(elapsed % 60).padStart(2, "0")}
            </p>
          </div>
          <button type="button" data-testid="time-stop"
            onClick={() => void handleStop()}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700">
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>
      )}

      {/* Controls */}
      {!activeEntry && (
        <div className="flex gap-2">
          <select value={activeType} onChange={(e) => setActiveType(e.target.value as TimeEntryType)}
            className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm">
            {TYPES.map((t) => <option key={t} value={t}>{TIME_ENTRY_LABELS[t]}</option>)}
          </select>
          <button type="button" data-testid="time-start"
            onClick={() => void handleStart()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">
            <Play className="h-4 w-4" /> Start
          </button>
        </div>
      )}

      {/* Totals */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {TYPES.filter((t) => totals[t] > 0).map((t) => (
            <div key={t} className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{TIME_ENTRY_LABELS[t]}</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <Timer className="h-3 w-3 text-slate-400" />
                {formatDuration(totals[t])}
              </p>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !activeEntry && (
        <p className="text-sm text-slate-400">Aucun pointage pour cette intervention.</p>
      )}
    </section>
  );
}
