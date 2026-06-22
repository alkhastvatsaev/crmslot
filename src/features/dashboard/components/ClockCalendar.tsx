"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { useDashboardPageSelectorOptional } from "@/features/dashboard/DashboardPageSelectorContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";

type ClockCalendarProps = {
  compact?: boolean;
  /** Clic sur date/heure → grille de pages (admin) ou calendrier mois (terrain). */
  interactive?: boolean;
  toggleTarget?: "pages" | "calendar";
};

export default function ClockCalendar({
  compact = false,
  interactive = false,
  toggleTarget = "pages",
}: ClockCalendarProps) {
  const [time, setTime] = useState<Date | null>(null);
  const { selectedDate, setSelectedDate } = useDateContext();
  const { language } = useTranslation();

  const locale = language === "nl" ? "nl-NL" : language === "en" ? "en-GB" : "fr-FR";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(new Date());
    const sync = () => setTime(new Date());
    const onVisibility = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = document.hidden ? null : setInterval(sync, 60_000);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [selectedDate]);

  const timeString = time?.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) || "";
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const dateString = selectedDate.toLocaleDateString(locale, dateOptions).replace(/\./g, "") || "";

  const pageSelector = useDashboardPageSelectorOptional();

  const changeDay = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  const compactDateTime = (
    <>
      <span
        data-testid="date-display"
        className="min-w-0 truncate whitespace-nowrap text-sm font-semibold uppercase tracking-wider text-slate-800"
      >
        {dateString}
      </span>
      <span className="h-4 w-px shrink-0 bg-slate-300" aria-hidden />
      <span
        data-testid="time-display"
        className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-800"
      >
        {timeString}
      </span>
    </>
  );

  if (compact) {
    return (
      <div
        data-testid="clock-calendar-widget"
        className={cn(
          "mobile-header-chip mobile-profile-chip h-full w-full flex-row items-center justify-between gap-2 px-4"
        )}
      >
        <button
          data-testid="prev-day-btn"
          onClick={(e) => changeDay(e, -1)}
          className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
          type="button"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {interactive && pageSelector ? (
          <button
            type="button"
            data-testid="clock-calendar-toggle"
            className="mobile-header-chip--interactive flex min-w-0 flex-1 flex-row items-center justify-center gap-4 rounded-[inherit]"
            aria-label={
              toggleTarget === "calendar" ? "Ouvrir le calendrier" : "Ouvrir la navigation"
            }
            aria-expanded={
              toggleTarget === "calendar"
                ? pageSelector.view === "calendar"
                : pageSelector.view === "pages"
            }
            onClick={() =>
              toggleTarget === "calendar" ? pageSelector.toggleCalendar() : pageSelector.toggle()
            }
          >
            {compactDateTime}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 flex-row items-center justify-center gap-4">
            {compactDateTime}
          </div>
        )}
        <button
          data-testid="next-day-btn"
          onClick={(e) => changeDay(e, 1)}
          className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
          type="button"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        id="dynamic-widget"
        data-glass-panel=""
        data-testid="clock-calendar-widget"
        className={cn(
          "panel-glass panel-glass--blur",
          "state-clock",
          "relative z-[1] w-full min-w-0"
        )}
      >
        <div
          data-glass-panel-inner=""
          className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[inherit]"
        >
          <div id="clock-content" className="flex items-center justify-between w-full px-2">
            <button
              data-testid="prev-day-btn"
              onClick={(e) => changeDay(e, -1)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700 flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-row items-center gap-4 flex-1 justify-center min-w-0">
              <div
                id="date-display"
                data-testid="date-display"
                className="whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-wider"
              >
                {dateString}
              </div>
              <div className="w-px h-4 bg-slate-300 flex-shrink-0" />
              <div
                id="time-display"
                data-testid="time-display"
                className="whitespace-nowrap tabular-nums"
              >
                {timeString}
              </div>
            </div>

            <button
              data-testid="next-day-btn"
              onClick={(e) => changeDay(e, 1)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700 flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
