/** Pause / reprise Mapbox GL — mobile garde l’instance (tuiles en cache). */

export type MapboxLifecycleMode = "pause" | "destroy";

export function resolveMapboxLifecycleMode(isMobile: boolean): MapboxLifecycleMode {
  return isMobile ? "pause" : "destroy";
}

export function pauseMapboxMap(map: { stop: () => void }): void {
  try {
    map.stop();
  } catch {
    /* WebGL déjà arrêté */
  }
}

export function resumeMapboxMap(map: { resize: () => void }): void {
  try {
    map.resize();
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
