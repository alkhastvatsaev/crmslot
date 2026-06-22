"use client";

import { useEffect, useState } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import type { NativeCoords } from "@/core/native/nativeGeolocation";

export type UserLocation = {
  longitude: number;
  latitude: number;
  accuracy: number;
};

type Options = { lowAccuracy?: boolean };

export function useNativeUserLocation(active: boolean, options: Options = {}): UserLocation | null {
  const [coords, setCoords] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let cleanup: (() => Promise<void> | void) | null = null;

    (async () => {
      if (isCapacitorNative()) {
        const { watchNativePosition } = await import("@/core/native/nativeGeolocation");
        const stop = await watchNativePosition((p: NativeCoords) => {
          if (cancelled) return;
          setCoords({ longitude: p.longitude, latitude: p.latitude, accuracy: p.accuracy });
        });
        if (cancelled) {
          stop?.();
          return;
        }
        cleanup = stop;
        return;
      }

      if (typeof navigator === "undefined" || !navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (cancelled) return;
          setCoords({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: options.lowAccuracy !== true, maximumAge: 15_000, timeout: 20_000 }
      );
      cleanup = () => navigator.geolocation.clearWatch(watchId);
    })();

    return () => {
      cancelled = true;
      void cleanup?.();
    };
  }, [active, options.lowAccuracy]);

  return coords;
}
