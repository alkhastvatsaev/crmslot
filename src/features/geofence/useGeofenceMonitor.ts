"use client";

import { useCallback, useEffect, useRef } from "react";
import { ARRIVAL_RADIUS_METERS } from "./geofenceConstants";
import { haversineMeters } from "./geofenceUtils";
import type { Intervention } from "@/features/interventions";
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

const WEB_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30_000,
  timeout: 20_000,
};

/**
 * Surveille la position GPS et déclenche onArrival quand le technicien
 * arrive à moins de radiusMeters d'une intervention en cours.
 * Pause en arrière-plan pour préserver la batterie.
 */
export function useGeofenceMonitor(
  activeMissions: Intervention[],
  { enabled = true, radiusMeters = ARRIVAL_RADIUS_METERS, onArrival }: Options = {}
) {
  const missionsNeedingGps = activeMissions.filter(
    (mission) =>
      (mission.status === "assigned" || mission.status === "en_route") &&
      mission.location?.lat != null &&
      mission.location?.lng != null
  );
  const gpsEnabled = enabled && missionsNeedingGps.length > 0;

  const triggeredRef = useRef<Set<string>>(new Set());
  const onArrivalRef = useRef(onArrival);
  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  const check = useCallback(
    (sample: LatLngSample) => {
      const { latitude, longitude } = sample;
      for (const mission of missionsNeedingGps) {
        if (triggeredRef.current.has(mission.id)) continue;

        const dist = haversineMeters(
          latitude,
          longitude,
          mission.location!.lat,
          mission.location!.lng
        );
        if (dist <= radiusMeters) {
          triggeredRef.current.add(mission.id);
          onArrivalRef.current?.({ intervention: mission, distanceMeters: dist });
        }
      }
    },
    [missionsNeedingGps, radiusMeters]
  );

  useEffect(() => {
    if (!gpsEnabled) return;
    triggeredRef.current = new Set();

    let cancelled = false;
    let cleanup: (() => void | Promise<void>) | null = null;

    const stopWatch = () => {
      const fn = cleanup;
      cleanup = null;
      if (fn) void fn();
    };

    const startWatch = () => {
      if (cancelled || cleanup || typeof document === "undefined") return;
      if (document.hidden) return;

      if (isCapacitorNative()) {
        void (async () => {
          const stop = await watchNativePosition((coords) => {
            if (cancelled || document.hidden) return;
            check({ latitude: coords.latitude, longitude: coords.longitude });
          });
          if (cancelled) {
            await stop?.();
            return;
          }
          cleanup = () => {
            void stop?.();
          };
        })();
        return;
      }

      if (typeof navigator === "undefined" || !navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => check({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        undefined,
        WEB_GEO_OPTIONS
      );
      cleanup = () => navigator.geolocation.clearWatch(watchId);
    };

    const onVisibility = () => {
      if (document.hidden) stopWatch();
      else startWatch();
    };

    startWatch();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      stopWatch();
    };
  }, [gpsEnabled, check]);
}
