"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  Navigation2,
  CheckCircle2,
  TrendingUp,
  Route,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import {
  HUB_FONT_OUTFIT,
  hubButtonClassName,
  HubButton,
  HubCard,
  HubPanelHeader,
} from "@/core/ui/hub";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicianMissionDayAnchor } from "@/features/interventions/useTechnicianMissionDayAnchor";
import {
  interventionMatchesTab,
  sortInterventionsByScheduleAsc,
} from "@/features/interventions/technicianSchedule";
import TechnicianPushNotificationPanel from "@/features/notifications/components/TechnicianPushNotificationPanel";
import { optimizeTourOrder, getCurrentPosition } from "@/features/interventions/optimizeTourOrder";
import type { Intervention } from "@/features/interventions/types";
import { generateIcal } from "@/utils/generateIcal";

export default function TechnicianDayPanel() {
  const { t } = useTranslation();
  const { interventions, loading, firebaseUid } = useTechnicianAssignments();
  const missionDayAnchor = useTechnicianMissionDayAnchor();

  const todayInterventions = useMemo(() => {
    const matched = interventions.filter((iv) =>
      interventionMatchesTab(iv, "today", missionDayAnchor)
    );
    return sortInterventionsByScheduleAsc(matched);
  }, [interventions, missionDayAnchor]);

  const pendingToday = todayInterventions.filter(
    (iv) => iv.status !== "done" && iv.status !== "invoiced"
  );
  const completedToday = todayInterventions.filter(
    (iv) => iv.status === "done" || iv.status === "invoiced"
  );
  const totalToday = todayInterventions.length;

  const progressPercent =
    totalToday > 0 ? Math.round((completedToday.length / totalToday) * 100) : 0;

  const [optimizedOrder, setOptimizedOrder] = useState<Intervention[] | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const pos = await getCurrentPosition();
      setOptimizedOrder(optimizeTourOrder(pendingToday, pos));
    } catch {
      setOptimizedOrder(optimizeTourOrder(pendingToday, { lat: 50.85, lng: 4.35 }));
    } finally {
      setOptimizing(false);
    }
  };

  const displayedPending = optimizedOrder ?? pendingToday;
  const nextMission = displayedPending.length > 0 ? displayedPending[0] : null;

  const getNavigationUrl = () => {
    if (!nextMission?.address) return "";
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nextMission.address)}`;
  };

  const getStatusDisplay = () => {
    if (!nextMission?.scheduledDate) return null;
    const now = new Date();
    const scheduled = new Date(nextMission.scheduledDate);
    const isLate = now.getTime() > scheduled.getTime() + 15 * 60000;

    if (isLate) {
      return {
        label: t("technician_hub.day.late"),
        color: "text-rose-500",
        bg: "bg-rose-500/10 border-rose-500/20",
      };
    }
    return {
      label: t("technician_hub.day.on_time"),
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    };
  };

  const nextStatus = getStatusDisplay();

  return (
    <div
      data-testid="technician-day-panel"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-4"
    >
      <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex flex-col gap-4 shrink-0`}>
        <HubPanelHeader
          variant="page"
          title={String(t("technician_hub.day.radar"))}
          subtitle={String(t("technician_hub.day.my_day"))}
          icon={<TrendingUp className="h-6 w-6" aria-hidden />}
        />

        <HubCard
          padding="md"
          className="relative overflow-hidden shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
        >
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/2 rounded bg-slate-200"></div>
              <div className="h-2 w-full rounded bg-slate-100"></div>
            </div>
          ) : !firebaseUid ? (
            <p className="text-[13px] font-medium text-slate-500">
              {t("technician_hub.day.login_required")}
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Jauge de progression */}
              <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-[13px] font-bold text-slate-700">
                      {t("technician_hub.day.completed_fraction")}: {completedToday.length}/
                      {totalToday}
                    </span>
                  </div>
                  <span className="text-[15px] font-extrabold text-emerald-600">
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 inset-ring-1 inset-ring-slate-900/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {nextMission ? (
                <div className="relative mt-2 overflow-hidden rounded-[16px] border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl"></div>

                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-indigo-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {t("technician_hub.day.next")}
                      </p>
                      {nextStatus && (
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${nextStatus.bg}`}
                        >
                          <Clock className={`h-3 w-3 ${nextStatus.color}`} />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${nextStatus.color}`}
                          >
                            {nextStatus.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mt-0.5 line-clamp-2 text-[15px] leading-tight font-bold text-slate-900">
                        {nextMission.title ||
                          nextMission.address ||
                          t("technician_hub.day.no_details")}
                      </p>
                    </div>

                    {nextMission.address && (
                      <a
                        href={getNavigationUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={hubButtonClassName({ fullWidth: true, className: "mt-1" })}
                      >
                        <Navigation2 className="h-4 w-4" />
                        {t("technician_hub.day.launch_gps")}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
                  <p className="text-[14px] font-bold text-slate-700">
                    {t("technician_hub.day.day_finished")}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-slate-500">
                    {t("technician_hub.day.no_other_mission")}
                  </p>
                </div>
              )}

              {pendingToday.length > 1 && (
                <div className="mt-3 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-violet-200 bg-violet-50 px-4 py-2.5 text-[13px] font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                  >
                    <Route className="h-4 w-4" />
                    {optimizing
                      ? "Calcul en cours…"
                      : optimizedOrder
                        ? "Recalculer la tournée"
                        : "Optimiser la tournée"}
                  </button>

                  {optimizedOrder && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Ordre optimal
                      </p>
                      {optimizedOrder.map((iv, idx) => (
                        <div
                          key={iv.id}
                          className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-2"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-extrabold text-violet-700">
                            {idx + 1}
                          </span>
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate text-[12px] font-semibold text-slate-700">
                            {iv.title || iv.address || "Mission"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </HubCard>
      </div>

      {todayInterventions.length > 0 && (
        <div className="shrink-0 px-1">
          <HubButton
            type="button"
            variant="secondary"
            fullWidth
            className="text-[12px]"
            onClick={() => generateIcal(todayInterventions, "Ma journée CRMSLOT")}
          >
            <CalendarDays className="h-4 w-4" />
            Exporter en iCal (.ics)
          </HubButton>
        </div>
      )}

      <TechnicianPushNotificationPanel />
    </div>
  );
}
