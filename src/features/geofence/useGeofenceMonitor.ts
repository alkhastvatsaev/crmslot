"use client";

import { useEffect, useRef, useCallback } from "react";
import { ARRIVAL_RADIUS_METERS } from "./geofenceConstants";
import { haversineMeters } from "./geofenceUtils";
import type { Intervention } from "@/features/interventions/types";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { watchNativePosition } from "@/core/native/nativeGeolocation";

type GeofenceEvent = {
  intervention: Intervention;
  distanceMeters: number;
};

type Options = {
  enabled?: boolean;
  radiusMeters?: number;
  onArrival?: (event: GeofenceEvent) => void;
};

type LatLngSample = { latitude: number; longitude: number };

/**
 * Surveille la position GPS et déclenche onArrival quand le technicien
 * arrive à moins de radiusMeters d'une intervention en cours.
 *
 * En Capacitor native : utilise @capacitor/geolocation (permissions natives).
 * En web : fallback navigator.geolocation.watchPosition.
 */
export function useGeofenceMonitor(
  activeMissions: Intervention[],
  { enabled = true, radiusMeters = ARRIVAL_RADIUS_METERS, onArrival }: Options = {}
) {
  const triggeredRef = useRef<Set<string>>(new Set());
  const onArrivalRef = useRef(onArrival);
  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  const check = useCallback(
    (sample: LatLngSample) => {
      const { latitude, longitude } = sample;
      for (const mission of activeMissions) {
        if (!mission.location?.lat || !mission.location?.lng) continue;
        if (triggeredRef.current.has(mission.id)) continue;
        if (mission.status !== "assigned" && mission.status !== "en_route") continue;

        const dist = haversineMeters(
          latitude,
          longitude,
          mission.location.lat,
          mission.location.lng
        );
        if (dist <= radiusMeters) {
          triggeredRef.current.add(mission.id);
          onArrivalRef.current?.({ intervention: mission, distanceMeters: dist });
        }
      }
    },
    [activeMissions, radiusMeters]
  );

  useEffect(() => {
    if (!enabled) return;
    triggeredRef.current = new Set();

    // Capacitor native : plugin Geolocation (permissions natives + background fiabilité).
    if (isCapacitorNative()) {
      let cancelled = false;
      let unwatch: (() => Promise<void>) | null = null;

      void (async () => {
        const stop = await watchNativePosition((coords) => {
          if (cancelled) return;
          check({ latitude: coords.latitude, longitude: coords.longitude });
        });
        if (cancelled) {
          await stop?.();
          return;
        }
        unwatch = stop;
      })();

      return () => {
        cancelled = true;
        void unwatch?.();
      };
    }

    // Web : navigator.geolocation
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => check({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      undefined,
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, check]);
}
