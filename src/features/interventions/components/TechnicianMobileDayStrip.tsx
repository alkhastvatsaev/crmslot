"use client";

import type { Intervention } from "@/features/interventions/types";
import { buildTechnicianMissionPresentation } from "@/features/interventions/technicianMissionPresentation";
import { cn } from "@/lib/utils";

type Props = {
  missions: Intervention[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  t: (key: string) => string;
};

/** Bandeau horizontal — changer de mission en un tap (style Uber). */
export default function TechnicianMobileDayStrip({ missions, selectedId, onSelect, t }: Props) {
  if (missions.length === 0) {
    return (
      <div
        data-testid="technician-mobile-day-strip-empty"
        className="shrink-0 border-b border-slate-200/80 px-4 py-3 text-center text-[13px] font-medium text-slate-500"
      >
        —
      </div>
    );
  }

  return (
    <div
      data-testid="technician-mobile-day-strip"
      className="shrink-0 border-b border-slate-200/80 bg-white/90"
    >
      <div className="flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {missions.map((iv) => {
          const { shortClientLabel, timeLabel } = buildTechnicianMissionPresentation(iv, t);
          const selected = iv.id === selectedId;
          return (
            <button
              key={iv.id}
              type="button"
              data-testid={`technician-mobile-mission-chip-${iv.id}`}
              data-selected={selected ? "true" : "false"}
              onClick={() => onSelect(iv.id)}
              className={cn(
                "flex shrink-0 flex-col items-start rounded-2xl border px-3.5 py-2 text-left transition active:scale-[0.98]",
                selected
                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              )}
            >
              <span className="text-[15px] font-bold tabular-nums leading-none">{timeLabel}</span>
              <span
                className={cn(
                  "mt-1 max-w-[9rem] truncate text-[13px] font-semibold",
                  selected ? "text-white/90" : "text-slate-600"
                )}
              >
                {shortClientLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
