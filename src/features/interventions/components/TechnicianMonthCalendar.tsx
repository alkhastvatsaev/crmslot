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

function dayToneClass(tone: TechnicianMonthDayTone, selected: boolean, today: boolean): string {
  if (selected) {
    return "border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.55)]";
  }
  if (today) {
    return "border-blue-300 bg-blue-50/90 text-slate-900 ring-2 ring-blue-200/80";
  }
  switch (tone) {
    case "awaiting":
      return "border-amber-200/90 bg-amber-50 text-amber-950";
    case "scheduled":
      return "border-blue-200/90 bg-blue-50 text-slate-900";
    case "completed":
      return "border-emerald-200/90 bg-emerald-50/90 text-emerald-950";
    case "mixed":
      return "border-violet-200/90 bg-gradient-to-br from-blue-50 to-emerald-50 text-slate-900";
    default:
      return "border-slate-200/80 bg-white text-slate-600";
  }
}

function LegendDot({ className }: { className: string }) {
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", className)} aria-hidden />;
}

/** Calendrier mois terrain — vue globale + sélection rapide du jour. */
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
      return raw.map(String);
    }
    return WEEKDAY_KEYS.map((key) => String(t(`technician_hub.dashboard.calendar.weekday_${key}`)));
  }, [t, tValue]);

  const handlePickDay = (date: Date) => {
    setSelectedDate(date);
    onClose();
  };

  return (
    <section
      data-testid="technician-month-calendar"
      className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3"
      aria-label={String(t("technician_hub.dashboard.calendar.title"))}
    >
      <header className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          data-testid="technician-calendar-prev-month"
          onClick={() => setMonthAnchor((prev) => addCalendarMonths(prev, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          aria-label={String(t("technician_hub.dashboard.calendar.prev_month"))}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p
            data-testid="technician-calendar-month-title"
            className="truncate text-[15px] font-bold capitalize tracking-tight text-slate-900"
          >
            {monthTitle}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
            {t("technician_hub.dashboard.calendar.subtitle")}
          </p>
        </div>

        <button
          type="button"
          data-testid="technician-calendar-next-month"
          onClick={() => setMonthAnchor((prev) => addCalendarMonths(prev, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          aria-label={String(t("technician_hub.dashboard.calendar.next_month"))}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          data-testid="technician-calendar-close"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          aria-label={String(t("common.close"))}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="grid shrink-0 grid-cols-7 gap-1 px-0.5">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        data-testid="technician-calendar-grid"
        className="mt-1 grid min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-1.5"
      >
        {cells.map(({ date, inMonth, ymd }) => {
          const summary = daySummaries.get(ymd);
          const tone = resolveTechnicianMonthDayTone(summary);
          const isSelected = ymd === selectedYmd;
          const isToday = ymd === todayYmd;

          return (
            <button
              key={ymd}
              type="button"
              data-testid={`technician-calendar-day-${ymd}`}
              data-calendar-tone={tone}
              data-calendar-in-month={inMonth ? "true" : "false"}
              disabled={!inMonth}
              onClick={() => handlePickDay(date)}
              className={cn(
                "relative flex min-h-[2.65rem] flex-col items-center justify-center rounded-xl border text-[13px] font-semibold tabular-nums transition active:scale-[0.97]",
                !inMonth && "pointer-events-none opacity-30",
                dayToneClass(tone, isSelected, isToday && !isSelected)
              )}
            >
              <span>{date.getDate()}</span>
              {summary && summary.total > 0 ? (
                <span
                  data-testid={`technician-calendar-day-count-${ymd}`}
                  className={cn(
                    "absolute bottom-1 rounded-full px-1 text-[9px] font-bold leading-none",
                    isSelected ? "bg-white/25 text-white" : "bg-black/5 text-slate-600"
                  )}
                >
                  {summary.total}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <footer
        data-testid="technician-calendar-legend"
        className="mt-3 shrink-0 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2.5"
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t("technician_hub.dashboard.calendar.legend_title")}
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-blue-500" />
            {t("technician_hub.dashboard.calendar.legend_scheduled")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-emerald-500" />
            {t("technician_hub.dashboard.calendar.legend_completed")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-amber-500" />
            {t("technician_hub.dashboard.calendar.legend_awaiting")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendDot className="bg-violet-400" />
            {t("technician_hub.dashboard.calendar.legend_mixed")}
          </span>
        </div>
      </footer>
    </section>
  );
}
