import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, isBefore, startOfToday, parse } from "date-fns";
import { fr, enUS as en, nl as nlLocale } from "date-fns/locale";
import { Loader2, Calendar as CalendarIcon, Clock, ChevronRight, ChevronDown } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  SMART_TIME_SLOT_WORKING_HOURS,
  type SmartTimeSlotNextSlot,
} from "@/features/interventions/smartTimeSlotConstants";

type SmartTimeSlotNextAvailabilitiesProps = {
  bookedSlotsByDate: Record<string, string[]>;
  loading: boolean;
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
};

export function SmartTimeSlotNextAvailabilities({
  bookedSlotsByDate,
  loading,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: SmartTimeSlotNextAvailabilitiesProps) {
  const { t, language } = useTranslation();
  const localeMap = { fr, en, nl: nlLocale };
  const currentLocale = localeMap[language as keyof typeof localeMap] || fr;
  const [visibleSlotsCount, setVisibleSlotsCount] = useState(8);

  const nextAvailableSlots = useMemo(() => {
    const slots: SmartTimeSlotNextSlot[] = [];
    const now = new Date();
    const today = startOfToday();
    const tomorrow = addDays(today, 1);

    for (let i = 0; i < 7; i++) {
      const day = addDays(today, i);
      const dateStr = format(day, "yyyy-MM-dd");
      const isToday = isSameDay(day, now);
      const isTom = isSameDay(day, tomorrow);

      const bookedForDay = bookedSlotsByDate[dateStr] || [];

      for (const time of SMART_TIME_SLOT_WORKING_HOURS) {
        let isPast = false;
        if (isToday) {
          const slotDate = parse(time, "HH:mm", new Date());
          if (isBefore(slotDate, now)) {
            isPast = true;
          }
        }

        const isBooked = bookedForDay.includes(time);

        if (!isPast && !isBooked) {
          slots.push({
            date: dateStr,
            time,
            dateObj: day,
            isToday,
            isTomorrow: isTom,
          });
        }
      }
    }

    return slots;
  }, [bookedSlotsByDate]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 shrink-0" />
          {t("smart_time_slot.next_availabilities")}
        </label>
        {loading && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("smart_time_slot.searching")}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {!loading && nextAvailableSlots.length === 0 ? (
          <div className="text-amber-600 font-medium bg-amber-50 p-4 rounded-xl border border-amber-100 text-base text-center">
            {t("smart_time_slot.no_availability")}
          </div>
        ) : (
          <>
            {nextAvailableSlots.slice(0, visibleSlotsCount).map((slot) => {
              const isSelected = selectedDate === slot.date && selectedTime === slot.time;

              let dateLabel = format(slot.dateObj, "EEEE d MMMM", { locale: currentLocale });
              if (slot.isToday) dateLabel = t("smart_time_slot.today");
              else if (slot.isTomorrow) dateLabel = t("smart_time_slot.tomorrow");

              dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

              return (
                <button
                  key={`${slot.date}-${slot.time}`}
                  type="button"
                  onClick={() => {
                    onDateSelect(slot.date);
                    onTimeSelect(slot.time);
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                    isSelected
                      ? "border-black bg-black text-white shadow-md"
                      : "border-black/[0.08] bg-white hover:border-black/[0.2] hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={cn(
                        "text-base font-medium",
                        isSelected ? "text-white/80" : "text-slate-500"
                      )}
                    >
                      {dateLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 opacity-70" />
                      <span className="text-xl font-bold">{slot.time}</span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-full",
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                    )}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </button>
              );
            })}

            {visibleSlotsCount < nextAvailableSlots.length && (
              <button
                type="button"
                onClick={() => setVisibleSlotsCount((prev) => prev + 8)}
                className="flex items-center justify-center gap-1.5 py-3 mt-1 text-base font-bold text-slate-500 hover:text-slate-800 transition-colors rounded-xl hover:bg-slate-50"
              >
                {t("smart_time_slot.show_more")}
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
