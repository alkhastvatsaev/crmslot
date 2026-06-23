"use client";

import { cn } from "@/lib/utils";
import type { Intervention } from "@/features/interventions/types";
import { localDayKeyFromParts } from "@/features/calendar/calendarGrid";

export default function InterventionCalendarMonthGrid({
  viewDate,
  weekdayLabels,
  monthCells,
  byDay,
  selectedDayKey,
  todayKey,
  onSelectDay,
}: {
  viewDate: Date;
  weekdayLabels: string[];
  monthCells: (number | null)[];
  byDay: Map<string, Intervention[]>;
  selectedDayKey: string | null;
  todayKey: string;
  onSelectDay: (key: string) => void;
}) {
  return (
    <div
      data-testid="calendar-month-grid"
      className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-white/92 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)]"
    >
      <div className="grid grid-cols-7 gap-0 border-b border-slate-100/90 bg-slate-50/60 px-1 pt-2">
        {weekdayLabels.map((w) => (
          <div
            key={w}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-1.5">
        {monthCells.map((cell, idx) => {
          if (cell === null) {
            return <div key={`empty-${idx}`} className="min-h-[64px]" aria-hidden />;
          }
          const y = viewDate.getFullYear();
          const m = viewDate.getMonth();
          const key = localDayKeyFromParts(y, m, cell);
          const count = byDay.get(key)?.length ?? 0;
          const pressed = selectedDayKey === key;
          const isTodayCell = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              data-testid={`calendar-month-cell-${key}`}
              onClick={() => onSelectDay(key)}
              aria-pressed={pressed}
              aria-label={
                count === 0
                  ? `Le ${cell}, aucune intervention`
                  : `Le ${cell}, ${count} intervention${count > 1 ? "s" : ""}`
              }
              className={cn(
                "relative flex min-h-[64px] flex-col items-center gap-1 rounded-[15px] border border-transparent px-0.5 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
                pressed ? "border-slate-900/14 bg-slate-900/[0.05]" : "hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold tabular-nums",
                  pressed
                    ? "bg-slate-900 text-white shadow-[0_4px_12px_-4px_rgba(15,23,42,0.45)]"
                    : isTodayCell
                      ? "text-sky-600 shadow-[inset_0_0_0_1.5px_rgba(56,189,248,0.55)]"
                      : "text-slate-800"
                )}
              >
                {cell}
              </span>
              {count > 0 ? (
                <span className="min-h-[14px] text-[11px] font-bold tabular-nums text-slate-900">
                  {count}
                </span>
              ) : (
                <span className="min-h-[14px]" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
