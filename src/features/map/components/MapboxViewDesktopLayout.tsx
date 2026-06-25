"use client";

import { AnimatePresence } from "framer-motion";
import DailyMissions from "@/features/dashboard/components/DailyMissions";
import BackOfficeInboxPanel from "@/features/backoffice/components/BackOfficeInboxPanel";
import RequesterTrackingPanel from "@/features/interventions/components/RequesterTrackingPanel";
import MapMissionSelectedOverlay from "@/features/map/components/MapMissionSelectedOverlay";
import MapboxMapControls from "@/features/map/components/MapboxMapControls";
import GlassPanel from "@/core/ui/GlassPanel";
import { GLASS_PANEL_BODY_SCROLL } from "@/core/ui/glassPanelChrome";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_DESKTOP_COL_CLASS,
  DASHBOARD_DESKTOP_GRID_CLASS,
  DASHBOARD_DESKTOP_GRID_FILL_CLASS,
  DASHBOARD_DESKTOP_ROOT_CLASS,
  dashboardMapCenterSquareClass,
  dashboardMapRightShellClass,
  dashboardTripleSideShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Mission } from "@/features/map/missionTypes";

type Props = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapBootError: "token" | "load" | null;
  visibleMissions: Mission[];
  selectedMission: Mission | null;
  setSelectedMission: (mission: Mission | null) => void;
  onMissionClick: (mission: Mission) => void;
  onArchiveMission: (mission: Mission) => void;
  onDeleteMission: (mission: Mission) => void;
  onRecenter: () => void;
  dashboardPageIndex: number;
  inboxDataActive: boolean;
};

export default function MapboxViewDesktopLayout({
  mapContainerRef,
  mapBootError,
  visibleMissions,
  selectedMission,
  setSelectedMission,
  onMissionClick,
  onArchiveMission,
  onDeleteMission,
  onRecenter,
  dashboardPageIndex,
  inboxDataActive,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={DASHBOARD_DESKTOP_ROOT_CLASS}>
      <div className={`${DASHBOARD_DESKTOP_GRID_CLASS} ${DASHBOARD_DESKTOP_GRID_FILL_CLASS}`}>
        <GlassPanel
          as="aside"
          id="dashboard-left-rail"
          className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--left`}
          shellClassName={dashboardTripleSideShellClass}
          innerClassName={`${GLASS_PANEL_BODY_SCROLL} !overflow-y-auto flex min-h-0 flex-col`}
        >
          <DailyMissions missions={visibleMissions} onMissionClick={onMissionClick} isEmbedded />
        </GlassPanel>

        <GlassPanel
          as="main"
          id="map-container"
          className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center`}
          shellClassName={dashboardMapCenterSquareClass}
          innerClassName="relative min-h-0 flex-1 p-0"
        >
          <div
            className="relative flex min-h-0 flex-1 flex-col"
            style={{ userSelect: "none", WebkitUserSelect: "none", background: "#f8fafc" }}
          >
            <div
              ref={mapContainerRef}
              id="map"
              className="absolute inset-0 h-full w-full min-h-[240px]"
            />
            {mapBootError ? (
              <div
                data-testid="map-boot-error"
                className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-slate-50/95 px-6 text-center"
              >
                <p className="text-[14px] font-medium text-slate-800">
                  {mapBootError === "token" ? t("map.boot_error_token") : t("map.boot_error_load")}
                </p>
                {mapBootError === "token" ? (
                  <p className="max-w-sm text-[12px] text-slate-500">
                    {t("map.boot_error_token_hint")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <MapboxMapControls layout="desktop" onRecenter={onRecenter} />

            <AnimatePresence>
              {selectedMission ? (
                <MapMissionSelectedOverlay
                  mission={selectedMission}
                  onClose={() => setSelectedMission(null)}
                  onArchive={onArchiveMission}
                  onDelete={onDeleteMission}
                  variant="desktop"
                />
              ) : null}
            </AnimatePresence>
          </div>
        </GlassPanel>

        <GlassPanel
          as="aside"
          className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--right`}
          shellClassName={dashboardMapRightShellClass}
          innerClassName="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn("flex min-h-0 flex-1 flex-col", dashboardPageIndex !== 0 && "hidden")}>
            <BackOfficeInboxPanel dayMissions={visibleMissions} inboxDataActive={inboxDataActive} />
          </div>
          <div className={cn("flex min-h-0 flex-1 flex-col", dashboardPageIndex === 0 && "hidden")}>
            <RequesterTrackingPanel />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
