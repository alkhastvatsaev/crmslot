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
  slots: PlanningHubSlot[];
  selectedSlotTime: string | null;
  onSelectSlot: (time: string) => void;
};

export default function PlanningHubSlotGrid({ slots, selectedSlotTime, onSelectSlot }: Props) {
  const { t } = useTranslation();
  const hasConflict = slots.some((s) => s.kind === "conflict");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
              aria-label={`${slot.time}${slot.label ? ` — ${slot.label}` : ""}`}
              onClick={() => onSelectSlot(slot.time)}
              className={cn(
                "flex min-h-[88px] flex-col items-center justify-center rounded-[20px] border p-3 ring-1 transition hover:scale-[1.02]",
                SLOT_CLASS[slot.kind],
                active && "ring-2 ring-slate-900/20"
              )}
            >
              <span className="text-[13px] font-bold tabular-nums">{slot.time}</span>
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
