"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { PlanningHubSlot } from "@/features/planningHub/planningHubTypes";

const SLOT_CLASS = {
  free: "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 ring-emerald-200/60",
  busy: "border-sky-200/80 bg-sky-50/80 text-sky-900 ring-sky-200/60",
  conflict: "border-red-300/80 bg-red-50/80 text-red-800 ring-red-200/60",
};

type Props = {
  techName: string;
  slots: PlanningHubSlot[];
  selectedSlotTime: string | null;
  onSelectSlot: (time: string) => void;
};

export default function PlanningHubSlotGrid({
  techName,
  slots,
  selectedSlotTime,
  onSelectSlot,
}: Props) {
  const { t } = useTranslation();
  const hasConflict = slots.some((s) => s.kind === "conflict");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-black/[0.05] px-4 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {t("planningHub.today")}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{techName}</p>
      </div>
      <div
        data-testid="planning-hub-slots"
        className="custom-scrollbar grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-4 sm:grid-cols-3"
      >
        {slots.map((slot) => {
          const active = selectedSlotTime === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              data-testid={`planning-slot-${slot.time}`}
              onClick={() => onSelectSlot(slot.time)}
              className={cn(
                "flex min-h-[88px] flex-col rounded-[20px] border p-3 text-left ring-1 transition hover:scale-[1.02]",
                SLOT_CLASS[slot.kind],
                active && "ring-2 ring-slate-900/20"
              )}
            >
              <span className="text-[11px] font-bold tabular-nums">{slot.time}</span>
              <span className="mt-1 line-clamp-2 text-[12px] font-medium leading-snug">
                {slot.label}
              </span>
            </button>
          );
        })}
      </div>
      {hasConflict ? (
        <p
          data-testid="planning-hub-conflict-alert"
          className="mx-4 mb-4 shrink-0 rounded-[16px] border border-red-200 bg-red-50 px-3 py-2 text-center text-[12px] text-red-800"
        >
          {t("planningHub.conflict_hint")}
        </p>
      ) : null}
    </div>
  );
}
