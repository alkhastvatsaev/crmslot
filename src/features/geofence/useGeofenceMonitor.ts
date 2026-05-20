"use client";

import { useEffect, useRef, useCallback } from "react";
import { ARRIVAL_RADIUS_METERS } from "./geofenceConstants";
import { haversineMeters } from "./geofenceUtils";
import type { Intervention } from "@/features/interventions/types";

type GeofenceEvent = {
  intervention: Intervention;
  distanceMeters: number;
};

type Options = {
  enabled?: boolean;
  radiusMeters?: number;
  onArrival?: (event: GeofenceEvent) => void;
};

/**
 * Surveille la position GPS et déclenche onArrival quand le technicien
 * arrive à moins de radiusMeters d'une intervention en cours.
 */
export function useGeofenceMonitor(
  activeMissions: Intervention[],
  { enabled = true, radiusMeters = ARRIVAL_RADIUS_METERS, onArrival }: Options = {},
) {
  const triggeredRef = useRef<Set<string>>(new Set());
  const onArrivalRef = useRef(onArrival);
  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  const check = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      for (const mission of activeMissions) {
        if (!mission.location?.lat || !mission.location?.lng) continue;
        if (triggeredRef.current.has(mission.id)) continue;
        if (mission.status !== "assigned" && mission.status !== "en_route") continue;

        const dist = haversineMeters(latitude, longitude, mission.location.lat, mission.location.lng);
        if (dist <= radiusMeters) {
          triggeredRef.current.add(mission.id);
          onArrivalRef.current?.({ intervention: mission, distanceMeters: dist });
        }
      }
    },
    [activeMissions, radiusMeters],
  );

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    triggeredRef.current = new Set();

    const watchId = navigator.geolocation.watchPosition(check, undefined, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, check]);
}
