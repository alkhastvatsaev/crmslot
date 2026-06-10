"use client";

import React from "react";
import { cn } from "@/lib/utils";

const AVAILABLE_TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

type Props = {
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  scheduledTime: string;
  setScheduledTime: (v: string) => void;
  takenSlots: Record<string, string[]>;
  onContinue: () => void;
};

export default function SmartFormStep4Schedule({
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  takenSlots,
  onContinue,
}: Props) {
  return (
    <div className="flex flex-col gap-4" role="region" aria-label="Étape 4 — Date et Heure">
      <p className="text-center text-[16px] font-extrabold tracking-tight text-slate-900">
        Quand êtes-vous disponible ?
      </p>

      <div className="flex flex-col gap-3">
        {/* Day picker */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1"
          aria-label="Jours disponibles"
        >
          {Array.from({ length: 14 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const isoDate = d.toISOString().split("T")[0];
            const active = scheduledDate === isoDate;
            const dayName = new Intl.DateTimeFormat("fr-BE", { weekday: "short" }).format(d);
            const dayNum = d.getDate();
            const monthName = new Intl.DateTimeFormat("fr-BE", { month: "short" }).format(d);
            return (
              <button
                key={isoDate}
                type="button"
                onClick={() => {
                  setScheduledDate(isoDate);
                  setScheduledTime("");
                }}
                className={cn(
                  "flex min-w-[70px] shrink-0 flex-col items-center justify-center rounded-[16px] border py-2.5 transition-all outline-none",
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-md scale-105"
                    : "border-black/[0.06] bg-white/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  {dayName}
                </span>
                <span className="text-xl font-black">{dayNum}</span>
                <span className="text-[10px] font-bold uppercase opacity-80">{monthName}</span>
              </button>
            );
          })}
        </div>

        {/* Time picker */}
        {scheduledDate ? (
          <div className="mt-2 grid grid-cols-4 gap-2 px-1">
            {AVAILABLE_TIMES.map((time) => {
              const active = scheduledTime === time;
              const taken = takenSlots[scheduledDate]?.includes(time);
              return (
                <button
                  key={time}
                  type="button"
                  disabled={taken}
                  onClick={() => setScheduledTime(time)}
                  className={cn(
                    "rounded-[12px] border py-2 text-sm font-bold transition-all outline-none",
                    taken
                      ? "border-transparent bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed"
                      : active
                        ? "border-blue-500 bg-blue-500 text-white shadow-md scale-105"
                        : "border-black/[0.06] bg-white/90 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 italic mt-4">
            Veuillez sélectionner une date ci-dessus.
          </p>
        )}
      </div>

      <button
        type="button"
        data-testid="smart-form-continue"
        disabled={!scheduledDate || !scheduledTime}
        onClick={onContinue}
        className="mt-2 min-h-[48px] w-full rounded-[14px] bg-slate-900 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-40"
      >
        Continuer
      </button>
    </div>
  );
}
