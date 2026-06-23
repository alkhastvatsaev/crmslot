"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Intervention } from "@/features/interventions/types";
import CalendarInterventionSlotRow from "@/features/calendar/components/CalendarInterventionSlotRow";

export default function InterventionCalendarWeekGrid({
  weekDays,
  byDay,
  selectedDayKey,
  todayKey,
  onSelectDay,
  t,
}: {
  weekDays: { date: Date; key: string }[];
  byDay: Map<string, Intervention[]>;
  selectedDayKey: string | null;
  todayKey: string;
  onSelectDay: (key: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div data-testid="calendar-week-grid" className="-mx-0.5">
      <p className="sr-only">Semaine : cartes jour en défilement horizontal.</p>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin]">
        {weekDays.map(({ date, key }) => {
          const items = byDay.get(key) ?? [];
          const pressed = selectedDayKey === key;
          const isTodayCol = key === todayKey;

          return (
            <div
              key={key}
              data-testid={`calendar-week-column-${key}`}
              className={cn(
                "flex min-w-[12rem] max-w-[16rem] shrink-0 snap-center flex-col rounded-[16px] border bg-white/95 p-3 shadow-[0_10px_36px_-20px_rgba(15,23,42,0.2)]",
                pressed
                  ? "border-slate-900 border-opacity-95 ring-2 ring-slate-900/12"
                  : "border-black/[0.05]"
              )}
            >
              <button
                type="button"
                className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 rounded-[14px] text-left outline-none transition hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-slate-900/18"
                onClick={() => onSelectDay(key)}
                aria-pressed={pressed}
                data-testid={`calendar-week-head-${key}`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-slate-900">
                    {date.getDate()}
                  </span>
                  <span className="text-[12px] font-semibold capitalize text-slate-500">
                    {new Intl.DateTimeFormat("fr-BE", { weekday: "short" }).format(date)}
                  </span>
                </span>
                {isTodayCol ? (
                  <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                    Auj.
                  </span>
                ) : null}
              </button>

              <div className="min-h-[120px] flex-1">
                {items.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {items.map((iv) => (
                      <CalendarInterventionSlotRow key={iv.id} iv={iv} t={t} />
                    ))}
                  </ul>
                ) : (
                  <div className="flex h-full min-h-[100px] flex-col items-center justify-center rounded-xl bg-slate-50/80 px-2 text-center">
                    <CalendarDays className="mb-1 h-8 w-8 text-slate-200" aria-hidden />
                    <p className="text-[11px] font-semibold leading-snug text-slate-400">Libre</p>
                    <p className="sr-only">Aucune intervention ce jour.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
