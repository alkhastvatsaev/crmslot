import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, isBefore, parse } from "date-fns";
import { fr, enUS as en, nl as nlLocale } from "date-fns/locale";
import { CalendarPlus } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { SmartTimeSlotPremiumCalendar } from "@/features/interventions/components/SmartTimeSlotPremiumCalendar";
import { SMART_TIME_SLOT_WORKING_HOURS } from "@/features/interventions/smartTimeSlotConstants";

type SmartTimeSlotSpecificDatePickerProps = {
  bookedSlotsByDate: Record<string, string[]>;
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
};

export function SmartTimeSlotSpecificDatePicker({
  bookedSlotsByDate,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: SmartTimeSlotSpecificDatePickerProps) {
  const { t, language } = useTranslation();
  const localeMap = { fr, en, nl: nlLocale };
  const currentLocale = localeMap[language as keyof typeof localeMap] || fr;

  const specificDateSlots = useMemo(() => {
    if (!selectedDate) return [];

    const now = new Date();
    const isToday = selectedDate === format(now, "yyyy-MM-dd");
    const bookedForDay = bookedSlotsByDate[selectedDate] || [];

    return SMART_TIME_SLOT_WORKING_HOURS.map((time) => {
      let isPast = false;
      if (isToday) {
        const slotDate = parse(time, "HH:mm", new Date());
        if (isBefore(slotDate, now)) {
          isPast = true;
        }
      }
      const isBooked = bookedForDay.includes(time);

      return {
        time,
        disabled: isPast || isBooked,
      };
    });
  }, [selectedDate, bookedSlotsByDate]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <label className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <CalendarPlus className="h-5 w-5 shrink-0" />
        {t("smart_time_slot.schedule_later")}
      </label>

      <div className="flex flex-col gap-4">
        <SmartTimeSlotPremiumCalendar
          selectedDate={selectedDate}
          onSelect={(date) => {
            onDateSelect(date);
            onTimeSelect("");
          }}
        />

        {selectedDate && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-base font-bold text-slate-500">
              {t("smart_time_slot.availabilities_on")}{" "}
              {format(parse(selectedDate, "yyyy-MM-dd", new Date()), "d MMMM", {
                locale: currentLocale,
              })}
            </span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {specificDateSlots
                .filter((s) => !s.disabled)
                .map(({ time }) => {
                  const isSelected = selectedTime === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => onTimeSelect(time)}
                      className={cn(
                        "flex items-center justify-center rounded-[12px] border py-3.5 text-base font-bold transition-all",
                        isSelected
                          ? "border-black bg-black text-white shadow-md"
                          : "border-black/[0.08] bg-white text-slate-700 hover:border-black/[0.2] hover:bg-slate-50 active:scale-95"
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
            </div>
            {specificDateSlots.filter((s) => !s.disabled).length === 0 && (
              <div className="text-amber-600 font-medium bg-amber-50 p-4 rounded-xl text-base border border-amber-100 text-center">
                {t("smart_time_slot.artisan_unavailable")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
