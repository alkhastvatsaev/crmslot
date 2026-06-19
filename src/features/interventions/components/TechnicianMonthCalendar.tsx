"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import {
  addCalendarMonths,
  buildCalendarMonthCells,
  buildTechnicianMissionDaySummaries,
  formatTechnicianMonthTitle,
  resolveTechnicianMonthDayTone,
  startOfCalendarMonth,
  type TechnicianMonthDayTone,
} from "@/features/interventions/technicianMonthCalendar";
import {
  localCalendarYmd,
  mapI18nLanguageToLocale,
} from "@/features/interventions/technicianSchedule";
import { cn } from "@/lib/utils";

type Props = {
  interventions: Intervention[];
  technicianUid: string | null;
  onClose: () => void;
};

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function toneDotClass(tone: TechnicianMonthDayTone): string {
  switch (tone) {
    case "awaiting":
      return "bg-amber-500";
    case "scheduled":
      return "bg-blue-500";
    case "completed":
      return "bg-emerald-500";
    case "mixed":
      return "bg-gradient-to-r from-blue-500 to-emerald-500";
    default:
      return "bg-transparent";
  }
}

function dayNumberClass(tone: TechnicianMonthDayTone, selected: boolean, today: boolean): string {
  if (selected) return "font-semibold text-slate-900";
  if (today) return "font-semibold text-slate-800";
  if (tone === "empty") return "font-normal text-slate-300";
  return "font-medium text-slate-700";
}

/** Calendrier mois terrain — vue globale minimaliste. */
export default function TechnicianMonthCalendar({ interventions, technicianUid, onClose }: Props) {
  const { selectedDate, setSelectedDate } = useDateContext();
  const { t, language, tValue } = useTranslation();
  const locale = mapI18nLanguageToLocale(language);
  const todayYmd = localCalendarYmd(new Date());
  const selectedYmd = localCalendarYmd(selectedDate);

  const [monthAnchor, setMonthAnchor] = useState(() => startOfCalendarMonth(selectedDate));

  const daySummaries = useMemo(
    () => buildTechnicianMissionDaySummaries(interventions, technicianUid),
    [interventions, technicianUid]
  );

  const cells = useMemo(() => buildCalendarMonthCells(monthAnchor), [monthAnchor]);
  const monthTitle = formatTechnicianMonthTitle(monthAnchor, locale);

  const weekdayLabels = useMemo(() => {
    const raw = tValue("technician_hub.dashboard.calendar.weekdays_short");
    if (Array.isArray(raw) && raw.length === 7) {
      return raw.map((label) => String(label).charAt(0));
    }
    return WEEKDAY_KEYS.map((key) =>
      String(t(`technician_hub.dashboard.calendar.weekday_${key}`)).charAt(0)
    );
  }, [t, tValue]);

  const handlePickDay = (date: Date) => {
    setSelectedDate(date);
    onClose();
  };

  return (
    <section
      data-testid="technician-month-calendar"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-4 pt-2"
      aria-label={String(t("technician_hub.dashboard.calendar.title"))}
    >
      <button
        type="button"
        data-testid="technician-calendar-close"
        onClick={onClose}
        className="absolute right-3 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label={String(t("common.close"))}
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>

      <header className="mb-5 flex shrink-0 items-center justify-center gap-5 pr-6">
        <button
          type="button"
          data-testid="technician-calendar-prev-month"
          onClick={() => setMonthAnchor((prev) => addCalendarMonths(prev, -1))}
          className="flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-700"
          aria-label={String(t("technician_hub.dashboard.calendar.prev_month"))}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <p
          data-testid="technician-calendar-month-title"
          className="min-w-0 truncate text-[17px] font-semibold capitalize tracking-tight text-slate-900"
        >
          {monthTitle}
        </p>

        <button
          type="button"
          data-testid="technician-calendar-next-month"
          onClick={() => setMonthAnchor((prev) => addCalendarMonths(prev, 1))}
          className="flex h-8 w-8 items-center justify-center text-slate-400 transition hover:text-slate-700"
          aria-label={String(t("technician_hub.dashboard.calendar.next_month"))}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </header>

      <div className="grid shrink-0 grid-cols-7 gap-y-1">
        {weekdayLabels.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="pb-2 text-center text-[11px] font-medium text-slate-300"
          >
            {label}
          </div>
        ))}
      </div>

      <div data-testid="technician-calendar-grid" className="grid auto-rows-fr grid-cols-7 gap-y-3">
        {cells.map(({ date, inMonth, ymd }) => {
          if (!inMonth) {
            return <div key={ymd} aria-hidden className="aspect-square" />;
          }

          const summary = daySummaries.get(ymd);
          const tone = resolveTechnicianMonthDayTone(summary);
          const isSelected = ymd === selectedYmd;
          const isToday = ymd === todayYmd;
          const hasMissions = tone !== "empty";

          return (
            <button
              key={ymd}
              type="button"
              data-testid={`technician-calendar-day-${ymd}`}
              data-calendar-tone={tone}
              onClick={() => handlePickDay(date)}
              className="group relative flex aspect-square flex-col items-center justify-center transition active:scale-95"
            >
              {isToday && !isSelected ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 m-auto h-9 w-9 rounded-full ring-1 ring-slate-200"
                />
              ) : null}
              {isSelected ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 m-auto h-9 w-9 rounded-full bg-slate-900"
                />
              ) : null}

              <span
                className={cn(
                  "relative z-[1] text-[15px] tabular-nums leading-none",
                  dayNumberClass(tone, isSelected, isToday),
                  isSelected && "text-white"
                )}
              >
                {date.getDate()}
              </span>

              {hasMissions ? (
                <span
                  aria-hidden
                  className={cn(
                    "relative z-[1] mt-1 h-1 w-1 rounded-full",
                    isSelected ? "bg-white/90" : toneDotClass(tone)
                  )}
                />
              ) : (
                <span aria-hidden className="mt-1 h-1 w-1" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
