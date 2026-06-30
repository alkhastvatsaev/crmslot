"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { logger } from "@/core/logger";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { configureMapboxWebView } from "@/features/map/configureMapboxWebView";
import {
  applyMapboxPremiumBasemapConfig,
  resolveMapboxInitOptions,
  resolveMapboxMapRuntimeOptions,
} from "@/features/map/mapboxPowerProfile";
import {
  markMapboxPerf,
  measureMapboxPerf,
  resolveMapboxDeviceTier,
} from "@/features/map/mapboxDeviceProfile";
import {
  destroyMapboxMap,
  pauseMapboxMap,
  resolveMapboxPauseOptions,
  resumeMapboxMap,
  scheduleMapboxResizeBurst,
} from "@/features/map/mapboxMapLifecycle";
import { resolveMapboxStyleSlug, resolveMapboxStyleUrl } from "@/features/map/mapboxStyleUrl";

export function useMapboxInstance(
  mapContainer: HTMLDivElement | null,
  isMobile: boolean,
  mapWebGLActive: boolean
) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapWebGLActiveRef = useRef(mapWebGLActive);
  mapWebGLActiveRef.current = mapWebGLActive;
  const [mapReady, setMapReady] = useState(false);
  const [mapBootError, setMapBootError] = useState<"token" | "load" | null>(null);
  const mapPauseOptions = resolveMapboxPauseOptions();
  const androidMapWebView = mapPauseOptions.skipStop === true;

  useEffect(() => {
    const container = mapContainer;
    if (!container || !mapWebGLActive || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
    if (!token) {
      setMapBootError("token");
      return;
    }

    let cancelled = false;
    let sizeObserver: ResizeObserver | null = null;
    let onVisibilityChange: (() => void) | null = null;
    let waitObserver: ResizeObserver | null = null;

    const attachMap = () => {
      if (cancelled || mapRef.current || !mapWebGLActive) return;
      if (container.clientWidth < 2 || container.clientHeight < 2) return;

      mapboxgl.accessToken = token;
      configureMapboxWebView(mapboxgl);
      const initialCenter: [number, number] = [4.3522, 50.8466];
      const mobileMap = isMobile === true;
      const deviceTier = mobileMap ? resolveMapboxDeviceTier() : "high";
      const powerOptions = resolveMapboxInitOptions(mobileMap, deviceTier);
      const runtimeOptions = resolveMapboxMapRuntimeOptions(mobileMap, undefined, deviceTier);
      const style = resolveMapboxStyleUrl(resolveMapboxStyleSlug(mobileMap), token);

      markMapboxPerf("init-start");

      if (
        typeof mapboxgl.supported === "function" &&
        !mapboxgl.supported({
          failIfMajorPerformanceCaveat: runtimeOptions.failIfMajorPerformanceCaveat,
        })
      ) {
        if (!cancelled) setMapBootError("load");
        return;
      }

      const map = new mapboxgl.Map({
        container,
        style,
        center: initialCenter,
        zoom: 12.5,
        pitch: 0,
        bearing: 0,
        antialias: powerOptions.antialias,
        fadeDuration: powerOptions.fadeDuration,
        refreshExpiredTiles: powerOptions.refreshExpiredTiles,
        maxTileCacheSize: powerOptions.maxTileCacheSize,
        renderWorldCopies: powerOptions.renderWorldCopies,
        collectResourceTiming: powerOptions.collectResourceTiming,
        respectPrefersReducedMotion: powerOptions.respectPrefersReducedMotion,
        failIfMajorPerformanceCaveat: runtimeOptions.failIfMajorPerformanceCaveat,
        preserveDrawingBuffer: androidMapWebView,
        maxBounds: [
          [4.15, 50.7],
          [4.55, 50.95],
        ],
        minZoom: 11.8,
        attributionControl: false,
        localIdeographFontFamily: "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
      });

      mapRef.current = map;
      setMapBootError(null);
      markMapboxPerf("init-end");

      if (mobileMap) {
        map.getContainer().dataset.mapboxDeviceTier = deviceTier;
      }

      if (isMobile) {
        map.dragPan.disable();
        map.touchZoomRotate.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        map.keyboard.disable();
      }

      map.on("load", () => {
        if (cancelled) return;
        markMapboxPerf("load");
        const perf = measureMapboxPerf(deviceTier);
        logger.info("[mapbox-perf]", perf);
        setMapReady(true);
        scheduleMapboxResizeBurst(map);
      });

      map.on("style.load", () => {
        applyMapboxPremiumBasemapConfig(map);
      });

      map.on("error", (ev) => {
        const detail =
          ev && typeof ev === "object" && "error" in ev
            ? (ev as { error?: { message?: string } }).error?.message
            : undefined;
        logger.error("[mapbox]", {
          error: detail ?? (ev instanceof Error ? ev.message : String(ev)),
        });
        if (!cancelled) setMapBootError("load");
      });

      map.on("moveend", () => {
        const currentState = {
          center: map.getCenter().toArray(),
          zoom: map.getZoom(),
          pitch: 0,
          bearing: 0,
        };
        localStorage.setItem("mapboxViewState", JSON.stringify(currentState));
      });

      let resizeRaf = 0;
      sizeObserver = new ResizeObserver(() => {
        if (document.hidden || !mapWebGLActiveRef.current) return;
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = window.requestAnimationFrame(() => {
          resizeRaf = 0;
          try {
            map.resize();
          } catch {
            /* ignore */
          }
        });
      });
      sizeObserver.observe(container);

      onVisibilityChange = () => {
        if (document.hidden) {
          pauseMapboxMap(map, mapPauseOptions);
          return;
        }
        resumeMapboxMap(map);
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
    };

    attachMap();
    if (!mapRef.current) {
      waitObserver = new ResizeObserver(() => attachMap());
      waitObserver.observe(container);
    }

    return () => {
      cancelled = true;
      waitObserver?.disconnect();
      sizeObserver?.disconnect();
      if (onVisibilityChange) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, mapWebGLActive, androidMapWebView, mapContainer]);

  useEffect(() => {
    if (!isCapacitorNative()) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      if (cancelled) return;
      const handle = await App.addListener("resume", () => {
        const map = mapRef.current;
        if (!map) return;
        scheduleMapboxResizeBurst(map);
        resumeMapboxMap(map);
      });
      removeListener = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!mapWebGLActive) {
      destroyMapboxMap(map);
      mapRef.current = null;
      setMapReady(false);
      return;
    }

    if (isMobile) {
      resumeMapboxMap(map);
    }
  }, [isMobile, mapWebGLActive]);

  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (!map) return;
      destroyMapboxMap(map);
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  return { mapRef, mapReady, mapBootError };
}
