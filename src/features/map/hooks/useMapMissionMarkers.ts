"use client";

import { useCallback, useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { resolveMapCameraDuration } from "@/features/map/mapboxPowerProfile";
import { isValidMissionCoordinates } from "@/features/map/mapMissionTransforms";
import { syncMapMissionMarkers } from "@/features/map/mapMissionMarkerDom";
import type { Mission } from "@/features/map/missionTypes";

type Args = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  mapReady: boolean;
  mapWebGLActive: boolean;
  isMobile: boolean;
  visibleMissions: Mission[];
  setSelectedMission: (mission: Mission | null) => void;
};

export function useMapMissionMarkers({
  mapRef,
  mapReady,
  mapWebGLActive,
  isMobile,
  visibleMissions,
  setSelectedMission,
}: Args) {
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});

  const flyToMission = useCallback(
    (center: [number, number]) => {
      mapRef.current?.flyTo({
        center,
        zoom: 17,
        pitch: 0,
        duration: resolveMapCameraDuration(isMobile === true, "marker"),
      });
    },
    [isMobile, mapRef]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !mapWebGLActive) return;

    syncMapMissionMarkers(
      map,
      visibleMissions,
      isMobile === true,
      markersRef,
      setSelectedMission,
      flyToMission,
      isValidMissionCoordinates
    );
  }, [
    flyToMission,
    isMobile,
    mapReady,
    mapRef,
    mapWebGLActive,
    setSelectedMission,
    visibleMissions,
  ]);

  return { flyToMission };
}
