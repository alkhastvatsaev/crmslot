"use client";

import React, { useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import "mapbox-gl/dist/mapbox-gl.css";
import MapHubMobileTripleLayout from "@/features/map/components/MapHubMobileTripleLayout";
import MapboxMapControls from "@/features/map/components/MapboxMapControls";
import MapMissionSelectedOverlay from "@/features/map/components/MapMissionSelectedOverlay";
import MapboxViewDesktopLayout from "@/features/map/components/MapboxViewDesktopLayout";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { resolveMapWebGLActive } from "@/features/map/mapMobileWebGLPolicy";
import { useMobileMapRenderGate } from "@/features/map/useMobileMapRenderGate";
import { useMapHubMissions } from "@/features/map/hooks/useMapHubMissions";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import { useMapboxInstance } from "@/features/map/hooks/useMapboxInstance";
import { useMapMissionMarkers } from "@/features/map/hooks/useMapMissionMarkers";
import { useMapUserPuckAndCamera } from "@/features/map/hooks/useMapUserPuckAndCamera";
import { resolveMapCameraDuration } from "@/features/map/mapboxPowerProfile";
import { scheduleMapboxResizeBurst } from "@/features/map/mapboxMapLifecycle";
import type { MobileHubRail } from "@/features/dashboard";
import type { Mission } from "@/features/map/missionTypes";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function MapboxView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isMobileClient = useIsMobile();
  const mobileHubLayout = useMobileHubLayout();
  const isMobile = mobileHubLayout || isMobileClient === true;
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const mapRenderActive = useMobileMapRenderGate(mapContainerRef);
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const mapHubDataActive = isMobile !== true || powerGate.mapHubDataActive;
  const dashboardPageIndex = pager?.pageIndex ?? 0;
  const mapWebGLActive = resolveMapWebGLActive(isMobile, dashboardPageIndex, mapRenderActive);
  const { t } = useTranslation();
  const requestMobileHubRail = useRequestMobileHubRail();

  const {
    visibleMissions,
    selectedMission,
    setSelectedMission,
    handleArchiveMission,
    handleDeleteMission,
    handleMissionClick: hubMissionClick,
  } = useMapHubMissions({ mapHubDataActive });

  const { mapRef, mapReady, mapBootError } = useMapboxInstance(
    mapContainerRef,
    isMobile === true,
    mapWebGLActive
  );

  const { flyToMission } = useMapMissionMarkers({
    mapRef,
    mapReady,
    mapWebGLActive,
    isMobile: isMobile === true,
    visibleMissions,
    setSelectedMission,
  });

  useMapUserPuckAndCamera({
    mapRef,
    mapReady,
    mapWebGLActive,
    mapRenderActive,
    isMobile: isMobile === true,
    visibleMissions,
    dashboardPageIndex,
    mapHubDataActive,
  });

  const handleMissionClick = useCallback(
    (mission: Mission) => {
      hubMissionClick(mission);
      if (mobileHubLayout) {
        requestMobileHubRail("left");
        if (mission.coordinates) flyToMission(mission.coordinates as [number, number]);
      }
    },
    [flyToMission, hubMissionClick, mobileHubLayout, requestMobileHubRail]
  );

  const handleRecenter = useCallback(() => {
    mapRef.current?.flyTo({
      center: [4.3522, 50.8466],
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      duration: resolveMapCameraDuration(isMobile === true, "recenter"),
      essential: true,
    });
  }, [isMobile, mapRef]);

  const handleMobileMapResize = useCallback(
    (rail: MobileHubRail) => {
      if (rail !== "left") return;
      const map = mapRef.current;
      if (!map) return;
      scheduleMapboxResizeBurst(map);
    },
    [mapRef]
  );

  const mapPanelInner = (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Carte"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none" as React.CSSProperties["WebkitUserSelect"],
        background: "#f8fafc",
      }}
    >
      <div ref={mapContainerRef} id="map" className="absolute inset-0 h-full w-full" />
      {mapBootError ? (
        <div
          data-testid="map-boot-error"
          className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-slate-50/95 px-6 text-center"
        >
          <p className="text-[14px] font-medium text-slate-800">
            {mapBootError === "token" ? t("map.boot_error_token") : t("map.boot_error_load")}
          </p>
          {mapBootError === "token" ? (
            <p className="max-w-sm text-[12px] text-slate-500">{t("map.boot_error_token_hint")}</p>
          ) : null}
        </div>
      ) : null}
      <MapboxMapControls layout="mobile" onRecenter={handleRecenter} />
      <AnimatePresence>
        {selectedMission ? (
          <MapMissionSelectedOverlay
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onArchive={handleArchiveMission}
            onDelete={handleDeleteMission}
            variant="desktop"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );

  if (mobileHubLayout) {
    return (
      <MapHubMobileTripleLayout
        mapRail={
          <div id="map-container" className="flex h-full min-h-0 flex-col">
            {mapPanelInner}
          </div>
        }
        visibleMissions={visibleMissions}
        inboxDataActive={powerGate.inboxDataActive}
        onMissionClick={handleMissionClick}
        onRailChange={handleMobileMapResize}
      />
    );
  }

  return (
    <MapboxViewDesktopLayout
      mapContainerRef={mapContainerRef}
      mapBootError={mapBootError}
      visibleMissions={visibleMissions}
      selectedMission={selectedMission}
      setSelectedMission={setSelectedMission}
      onMissionClick={(mission) => {
        hubMissionClick(mission);
        if (mapRef.current && mission.coordinates) {
          mapRef.current.flyTo({
            center: mission.coordinates,
            zoom: 17,
            pitch: 0,
            duration: resolveMapCameraDuration(isMobile === true, "marker"),
          });
        }
      }}
      onArchiveMission={handleArchiveMission}
      onDeleteMission={handleDeleteMission}
      onRecenter={handleRecenter}
      dashboardPageIndex={dashboardPageIndex}
      inboxDataActive={isMobile !== true || powerGate.inboxDataActive}
    />
  );
}
