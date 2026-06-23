"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { buildWeekCalendar, WEEKDAY_LABELS_FR, toIsoDate } from "../calendarUtils";
import type { Intervention } from "@/features/interventions";

interface Props {
  interventions: Intervention[];
  onSelectIntervention?: (intervention: Intervention) => void;
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  assigned: "bg-blue-400",
  in_progress: "bg-violet-500",
  done: "bg-emerald-500",
  cancelled: "bg-slate-300",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function DispatchWeekCalendar({ interventions, onSelectIntervention }: Props) {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const days = buildWeekCalendar(interventions, anchor);
  const today = toIsoDate(new Date());

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Agenda semaine</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAnchor((d) => addDays(d, -7))}
            className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-slate-600 w-32 text-center">
            {days[0]
              ? new Date(days[0].date + "T12:00:00").toLocaleDateString("fr-BE", {
                  day: "numeric",
                  month: "short",
                })
              : ""}
            {" – "}
            {days[6]
              ? new Date(days[6].date + "T12:00:00").toLocaleDateString("fr-BE", {
                  day: "numeric",
                  month: "short",
                })
              : ""}
          </span>
          <button
            type="button"
            onClick={() => setAnchor((d) => addDays(d, 7))}
            className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="ml-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Auj.
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS_FR.map((label, i) => (
          <div
            key={label}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1"
          >
            {label}
            <div
              className={`text-xs font-bold mt-0.5 ${
                days[i]?.date === today ? "text-blue-600" : "text-slate-600"
              }`}
            >
              {days[i] ? new Date(days[i].date + "T12:00:00").getDate() : ""}
            </div>
          </div>
        ))}

        {days.map((day, i) => (
          <div
            key={day.date}
            className={`min-h-[80px] rounded-lg border p-1 space-y-0.5 ${
              day.date === today ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white"
            } ${i >= 5 ? "bg-slate-50" : ""}`}
          >
            {day.interventions.map((iv) => (
              <button
                key={iv.id}
                type="button"
                onClick={() => onSelectIntervention?.(iv)}
                className="w-full text-left rounded px-1 py-0.5 hover:bg-white/80 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[iv.status] ?? "bg-slate-300"}`}
                  />
                  <span className="text-[10px] font-medium text-slate-700 truncate leading-tight">
                    {iv.clientName ?? iv.address ?? iv.id.slice(0, 8)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {interventions.filter((iv) => !iv.scheduledDate).length > 0 && (
        <p className="text-xs text-slate-400">
          {interventions.filter((iv) => !iv.scheduledDate).length} intervention(s) sans date
          planifiée
        </p>
      )}
    </section>
  );
}
