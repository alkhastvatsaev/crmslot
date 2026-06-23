"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  buildMonthGrid,
  filterScheduledInterventions,
  groupScheduledInterventionsByLocalDay,
  localDayKeyFromParts,
} from "@/features/calendar/calendarGrid";
import {
  calendarTodayKey,
  parseLocalDayKey,
  startOfWeekMonday,
  weekdaysShortForLocale,
} from "@/features/calendar/calendarPanelUtils";

export function useInterventionCalendarPanelController() {
  const { t, language } = useTranslation();
  const locale = language === "nl" ? "nl-BE" : language === "en" ? "en-GB" : "fr-BE";
  const weekdayLabels = useMemo(() => weekdaysShortForLocale(locale), [locale]);
  const workspace = useCompanyWorkspaceOptional();
  const [companyFilterId, setCompanyFilterId] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (workspace?.activeCompanyId) setCompanyFilterId(workspace.activeCompanyId);
  }, [workspace?.activeCompanyId]);

  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDayKey(localDayKeyFromParts(d.getFullYear(), d.getMonth(), d.getDate()));
  }, []);

  const tenantReady = Boolean(workspace?.isTenantUser && companyFilterId.trim());
  const { interventions, loading, error } = useBackOfficeInterventions(
    tenantReady ? companyFilterId : null
  );

  const scheduledOnly = useMemo(() => filterScheduledInterventions(interventions), [interventions]);
  const byDay = useMemo(
    () => groupScheduledInterventionsByLocalDay(scheduledOnly),
    [scheduledOnly]
  );

  const navigate = useMemo(() => {
    if (viewMode === "month") {
      return {
        prev: () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)),
        next: () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)),
      };
    }
    return {
      prev: () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7)),
      next: () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)),
    };
  }, [viewMode]);

  const monthTitle = useMemo(() => {
    const raw = new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric" }).format(
      viewDate
    );
    return raw.replace(/^\w/, (c) => c.toUpperCase());
  }, [viewDate]);

  const weekTitle = useMemo(() => {
    const s = startOfWeekMonday(viewDate);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    const fmt = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "short" });
    return `${fmt.format(s)} — ${fmt.format(e)}`;
  }, [viewDate]);

  const monthCells = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    return buildMonthGrid(y, m);
  }, [viewDate]);

  const weekDays = useMemo(() => {
    const s = startOfWeekMonday(viewDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return {
        date: d,
        key: localDayKeyFromParts(d.getFullYear(), d.getMonth(), d.getDate()),
      };
    });
  }, [viewDate]);

  const selectedItems = selectedDayKey ? (byDay.get(selectedDayKey) ?? []) : [];
  const todayKey = calendarTodayKey();

  const selectedDayLabel = useMemo(() => {
    if (!selectedDayKey) return null;
    const d = parseLocalDayKey(selectedDayKey);
    if (!d) return null;
    return new Intl.DateTimeFormat("fr-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d);
  }, [selectedDayKey]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setViewDate(now);
    setSelectedDayKey(localDayKeyFromParts(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);

  return {
    t,
    workspace,
    companyFilterId,
    setCompanyFilterId,
    viewMode,
    setViewMode,
    viewDate,
    selectedDayKey,
    setSelectedDayKey,
    tenantReady,
    loading,
    error,
    scheduledOnly,
    byDay,
    navigate,
    monthTitle,
    weekTitle,
    monthCells,
    weekDays,
    selectedItems,
    todayKey,
    selectedDayLabel,
    goToToday,
    weekdayLabels,
  };
}
