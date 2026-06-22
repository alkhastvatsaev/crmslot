"use client";

import { useEffect, useState, type RefObject } from "react";
import type mapboxgl from "mapbox-gl";
import { destroyMapboxMap } from "@/features/map/mapboxMapLifecycle";
import { useElementPageVisible } from "@/core/perf/useElementPageVisible";

type Options = {
  enabled?: boolean;
};

/**
 * Crée / détruit une instance Mapbox mini-carte selon la visibilité réelle.
 * Même règle que MapboxView admin : pas de WebGL actif hors écran.
 */
export function useMapboxMiniMapLifecycle(
  containerRef: RefObject<HTMLDivElement | null>,
  createMap: (container: HTMLDivElement) => mapboxgl.Map,
  deps: readonly unknown[],
  options: Options = {}
): mapboxgl.Map | null {
  const enabled = options.enabled !== false;
  const elementVisible = useElementPageVisible(containerRef);
  const active = enabled && elementVisible;
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) {
      setMapInstance((prev) => {
        if (prev) destroyMapboxMap(prev);
        return null;
      });
      return;
    }

    const map = createMap(container);
    setMapInstance(map);

    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        try {
          map.resize();
        } catch {
          /* container retiré */
        }
      });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      destroyMapboxMap(map);
      setMapInstance((prev) => (prev === map ? null : prev));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- factory stable via deps
  }, [active, containerRef, ...deps]);

  return mapInstance;
}
