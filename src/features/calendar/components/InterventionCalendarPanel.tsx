"use client";

import {
  Building2,
  CalendarRange,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { HubPanelHeader, HubSegmentedControl } from "@/core/ui/hub";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useInterventionCalendarPanelController } from "@/features/calendar/hooks/useInterventionCalendarPanelController";
import InterventionCalendarMonthGrid from "@/features/calendar/components/InterventionCalendarMonthGrid";
import InterventionCalendarWeekGrid from "@/features/calendar/components/InterventionCalendarWeekGrid";
import InterventionCalendarDayDetail from "@/features/calendar/components/InterventionCalendarDayDetail";

export default function InterventionCalendarPanel() {
  const c = useInterventionCalendarPanelController();
  const offlineAuth = !isConfigured || !firestore;

  if (!c.workspace || !c.workspace.isTenantUser || !c.workspace.memberships.length) {
    return (
      <div
        data-testid="calendar-integration-gate"
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit] px-4 py-6"
      >
        <div
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 rounded-[16px] border border-sky-200/40 bg-gradient-to-b from-sky-50/90 to-white/80 px-4 py-8 text-[13px] shadow-[0_14px_36px_-18px_rgba(15,23,42,0.12)]"
          aria-labelledby="calendar-gate-title"
        >
          <p id="calendar-gate-title" className="sr-only">
            Portail société requis pour afficher le planning.
          </p>
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-sky-500/12 text-sky-700">
            <Building2 className="h-7 w-7" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  const ws = c.workspace;

  return (
    <div
      data-testid="calendar-integration-panel"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
      aria-label="Planning des interventions"
    >
      <div className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex min-h-0 flex-1 flex-col gap-4")}>
        <header className="flex shrink-0 flex-col gap-3">
          <HubPanelHeader
            variant="page"
            title="Agenda"
            subtitle="Vue calendrier des interventions planifiées"
            icon={<CalendarDays className="h-[22px] w-[22px]" aria-hidden />}
          />

          <HubSegmentedControl
            value={c.viewMode}
            onChange={(id) => c.setViewMode(id as "month" | "week")}
            ariaLabel="Type de vue"
            size="compact"
            options={[
              {
                id: "month",
                label: "Mois",
                testId: "calendar-tab-month",
                icon: <CalendarDays className="h-4 w-4 opacity-80" aria-hidden />,
                activeAccent: "slate",
              },
              {
                id: "week",
                label: "Semaine",
                testId: "calendar-tab-week",
                icon: <CalendarRange className="h-4 w-4 opacity-80" aria-hidden />,
                activeAccent: "slate",
              },
            ]}
          />

          <div className="relative">
            <Building2
              className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Label htmlFor="calendar-filter-company" className="sr-only">
              Société
            </Label>
            <select
              id="calendar-filter-company"
              data-testid="calendar-filter-company"
              className="h-11 w-full cursor-pointer appearance-none rounded-[14px] border border-black/[0.06] bg-white/95 py-2 pl-10 pr-3 text-[13px] font-semibold text-slate-800 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
              value={c.companyFilterId}
              onChange={(e) => {
                const id = e.target.value;
                c.setCompanyFilterId(id);
                ws.setActiveCompanyId(id);
              }}
            >
              {ws.memberships.map((m) => (
                <option key={m.companyId} value={m.companyId}>
                  {m.companyName}
                </option>
              ))}
            </select>
          </div>
        </header>

        {offlineAuth ? (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-[14px] border border-amber-200/50 bg-amber-50/85 px-3.5 py-2.5 text-[12px] font-semibold text-amber-950"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <span>Connexion requise</span>
          </div>
        ) : null}

        {!offlineAuth && !auth?.currentUser ? (
          <p className="text-[12px] font-medium text-slate-600">Connectez-vous.</p>
        ) : null}

        {c.error ? (
          <p className="rounded-[16px] border border-rose-200/60 bg-rose-50/90 px-3 py-3 text-[13px] font-medium text-rose-900">
            {c.error}
          </p>
        ) : null}

        <div className="flex shrink-0 items-stretch gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="calendar-prev"
            className="h-11 w-11 shrink-0 rounded-[13px] border-black/[0.08] p-0 shadow-sm"
            onClick={c.navigate.prev}
            aria-label={String(c.t("calendar.aria.prev_period"))}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col justify-center rounded-[13px] border border-black/[0.06] bg-white/90 px-2 py-1.5 text-center shadow-[0_2px_16px_-8px_rgba(15,23,42,0.12)]">
            <p
              className="truncate text-[14px] font-bold leading-tight text-slate-900"
              data-testid="calendar-range-title"
            >
              {c.viewMode === "month" ? c.monthTitle : c.weekTitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="calendar-next"
            className="h-11 w-11 shrink-0 rounded-[13px] border-black/[0.08] p-0 shadow-sm"
            onClick={c.navigate.next}
            aria-label={String(c.t("calendar.aria.next_period"))}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <div className="flex shrink-0 justify-center">
          <button
            type="button"
            data-testid="calendar-go-today"
            onClick={c.goToToday}
            className="rounded-full border border-black/[0.06] bg-white/95 px-4 py-2 text-[12px] font-bold text-sky-700 shadow-sm transition hover:bg-sky-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
          >
            {String(c.t("backoffice.dashboard.today"))}
          </button>
        </div>

        {c.loading && c.tenantReady ? (
          <div data-testid="calendar-loading" className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200/50" aria-hidden />
            ))}
          </div>
        ) : null}

        {!c.loading && c.tenantReady && c.viewMode === "month" ? (
          <InterventionCalendarMonthGrid
            viewDate={c.viewDate}
            weekdayLabels={c.weekdayLabels}
            monthCells={c.monthCells}
            byDay={c.byDay}
            selectedDayKey={c.selectedDayKey}
            todayKey={c.todayKey}
            onSelectDay={c.setSelectedDayKey}
          />
        ) : null}

        {!c.loading && c.tenantReady && c.viewMode === "week" ? (
          <InterventionCalendarWeekGrid
            weekDays={c.weekDays}
            byDay={c.byDay}
            selectedDayKey={c.selectedDayKey}
            todayKey={c.todayKey}
            onSelectDay={c.setSelectedDayKey}
            t={c.t}
          />
        ) : null}

        {!c.loading && c.tenantReady && c.viewMode === "month" ? (
          <InterventionCalendarDayDetail
            selectedDayKey={c.selectedDayKey}
            selectedDayLabel={c.selectedDayLabel}
            selectedItems={c.selectedItems}
            t={c.t}
          />
        ) : null}

        <p className="sr-only">
          {c.scheduledOnly.length} intervention(s) planifiée(s) pour la société active
        </p>
      </div>
    </div>
  );
}
