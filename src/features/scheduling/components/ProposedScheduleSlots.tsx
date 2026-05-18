"use client";

import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { ProposedSlot } from "@/features/scheduling/proposeAvailableSlots";

type Props = {
  dateYmd: string;
  onDateChange: (dateYmd: string) => void;
  slots: ProposedSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  className?: string;
  /** i18n key for section title (default: scheduling.proposed_slots.title). */
  titleKey?: string;
};

export default function ProposedScheduleSlots({
  dateYmd,
  onDateChange,
  slots,
  selectedTime,
  onSelectTime,
  className,
  titleKey = "scheduling.proposed_slots.title",
}: Props) {
  const { t } = useTranslation();

  return (
    <section
      data-testid="proposed-schedule-slots"
      className={cn("rounded-[14px] border border-slate-100 bg-white p-3", className)}
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        {String(t(titleKey))}
      </p>
      <label className="mb-2 block">
        <span className="sr-only">{String(t("scheduling.proposed_slots.date_label"))}</span>
        <input
          type="date"
          data-testid="proposed-schedule-date"
          value={dateYmd}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex h-9 w-full rounded-[10px] border border-slate-200 px-2 text-sm font-medium text-slate-800"
        />
      </label>
      {slots.length === 0 ? (
        <p data-testid="proposed-schedule-empty" className="text-xs text-slate-500">
          {String(t("scheduling.proposed_slots.empty"))}
        </p>
      ) : (
        <div
          className="flex flex-wrap gap-1.5"
          role="listbox"
          aria-label={String(t("scheduling.proposed_slots.title"))}
        >
          {slots.map((slot) => {
            const active = selectedTime === slot.time;
            return (
              <button
                key={`${slot.date}-${slot.time}`}
                type="button"
                role="option"
                aria-selected={active}
                data-testid={`proposed-schedule-slot-${slot.time}`}
                onClick={() => onSelectTime(slot.time)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300",
                )}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
