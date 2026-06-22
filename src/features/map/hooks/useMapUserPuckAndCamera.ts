"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { resolveMapCameraDuration } from "@/features/map/mapboxPowerProfile";
import { isValidMissionCoordinates } from "@/features/map/mapMissionTransforms";
import { useNativeUserLocation } from "@/features/map/hooks/useNativeUserLocation";
import type { Mission } from "@/features/map/missionTypes";

type Args = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  mapReady: boolean;
  mapWebGLActive: boolean;
  mapRenderActive: boolean;
  isMobile: boolean;
  visibleMissions: Mission[];
  dashboardPageIndex: number;
  mapHubDataActive: boolean;
};

export function useMapUserPuckAndCamera({
  mapRef,
  mapReady,
  mapWebGLActive,
  mapRenderActive,
  isMobile,
  visibleMissions,
  dashboardPageIndex,
  mapHubDataActive,
}: Args) {
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const userLocation = useNativeUserLocation(mapReady && mapRenderActive && mapWebGLActive, {
    lowAccuracy: isMobile === true,
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const lngLat: [number, number] = [userLocation.longitude, userLocation.latitude];

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.setAttribute("data-testid", "map-user-puck");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.background = "#2563eb";
      el.style.border = "3px solid rgba(255,255,255,0.95)";
      el.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.18), 0 2px 6px rgba(0,0,0,0.25)";
      el.style.pointerEvents = "none";
      userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(lngLat);
    }
  }, [mapHubDataActive, mapReady, mapRef, userLocation]);

  useEffect(() => {
    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isMobile || !mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const coords = visibleMissions
      .filter((m) => m.coordinates && isValidMissionCoordinates(m.coordinates as [number, number]))
      .map((m) => m.coordinates as [number, number]);
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.flyTo({
        center: coords[0],
        zoom: 15,
        duration: resolveMapCameraDuration(true, "marker"),
      });
      return;
    }
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const bounds: mapboxgl.LngLatBoundsLike = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, {
      padding: 60,
      maxZoom: 15,
      duration: resolveMapCameraDuration(true, "bounds"),
    });
  }, [isMobile, mapReady, mapRef, visibleMissions]);

  useEffect(() => {
    if (dashboardPageIndex !== 0) return;
    const map = mapRef.current;
    if (!map) return;
    const resize = () => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    };
    resize();
    const id = window.setTimeout(resize, 520);
    return () => clearTimeout(id);
  }, [dashboardPageIndex, mapReady, mapRef]);
}
