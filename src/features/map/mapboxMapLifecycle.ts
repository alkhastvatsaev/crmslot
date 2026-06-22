/** Pause / reprise Mapbox GL — mobile garde l’instance (tuiles en cache). */

import { needsHttpsMapboxStyleUrl } from "@/features/map/mapboxStyleUrl";

export type MapboxLifecycleMode = "pause" | "destroy";

export type MapboxPauseOptions = {
  /** WebView Android : `stop()` vide le canvas WebGL — on ne pause que le rendu desktop. */
  skipStop?: boolean;
};

export function resolveMapboxPauseOptions(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): MapboxPauseOptions {
  return { skipStop: needsHttpsMapboxStyleUrl(userAgent) };
}

export function resolveMapboxLifecycleMode(isMobile: boolean): MapboxLifecycleMode {
  return isMobile ? "pause" : "destroy";
}

export function pauseMapboxMap(map: { stop: () => void }, _options?: MapboxPauseOptions): void {
  try {
    map.stop();
  } catch {
    /* WebGL déjà arrêté */
  }
}

export function resumeMapboxMap(map: { resize: () => void; triggerRepaint?: () => void }): void {
  try {
    map.resize();
    map.triggerRepaint?.();
  } catch {
    /* container caché */
  }
}

export function destroyMapboxMap(map: { remove: () => void }): void {
  try {
    map.remove();
  } catch {
    /* déjà détruit */
  }
}

/** Rafraîchit la taille du canvas après transitions layout (mobile / WebView). */
export function scheduleMapboxResizeBurst(map: { resize: () => void }): void {
  const resize = () => {
    try {
      map.resize();
    } catch {
      /* container caché */
    }
  };
  resize();
  if (typeof window !== "undefined") {
    window.requestAnimationFrame(resize);
    window.setTimeout(resize, 100);
    window.setTimeout(resize, 520);
  }
}
