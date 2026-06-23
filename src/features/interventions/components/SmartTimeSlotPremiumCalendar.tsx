import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  format,
  isBefore,
  startOfToday,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { fr, enUS as en, nl as nlLocale } from "date-fns/locale";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

type SmartTimeSlotPremiumCalendarProps = {
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function SmartTimeSlotPremiumCalendar({
  selectedDate,
  onSelect,
}: SmartTimeSlotPremiumCalendarProps) {
  const { tValue, language } = useTranslation();
  const localeMap = { fr, en, nl: nlLocale };
  const currentLocale = localeMap[language as keyof typeof localeMap] || fr;

  const [currentMonth, setCurrentMonth] = useState(() =>
    selectedDate ? parse(selectedDate, "yyyy-MM-dd", new Date()) : startOfToday()
  );
  const today = startOfToday();

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prev), startOfMonth(today))) {
      setCurrentMonth(prev);
    }
  };
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDaysRaw = tValue("calendar.weekdays_initials");
  const weekDays =
    Array.isArray(weekDaysRaw) && weekDaysRaw.length === 7
      ? (weekDaysRaw as string[])
      : ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="w-full bg-white rounded-[24px] border border-black/[0.08] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="flex items-center justify-center h-10 w-10 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
          disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfMonth(today))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-slate-800 capitalize tracking-tight">
          {format(currentMonth, "MMMM yyyy", { locale: currentLocale })}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="flex items-center justify-center h-10 w-10 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-sm font-bold text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
        {days.map((day, i) => {
          const isSelected = selectedDate === format(day, dateFormat);
          const isPast = isBefore(day, today);
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div key={i} className="flex items-center justify-center aspect-square">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onSelect(format(day, dateFormat))}
                className={cn(
                  "h-11 w-11 flex items-center justify-center rounded-full text-base font-bold transition-all",
                  !isCurrentMonth
                    ? "text-slate-300"
                    : isPast
                      ? "text-slate-300 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100 active:scale-95",
                  isSelected && "bg-black text-white shadow-md hover:bg-slate-900",
                  isSameDay(day, today) &&
                    !isSelected &&
                    !isPast &&
                    "border-2 border-slate-200 text-slate-800"
                )}
              >
                {format(day, "d")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
