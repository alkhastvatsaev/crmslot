import type mapboxgl from "mapbox-gl";
import { needsHttpsMapboxStyleUrl } from "@/features/map/mapboxStyleUrl";

/** Aligné sur `mapbox-gl` dans package.json — worker CDN de secours. */
export const MAPBOX_GL_JS_VERSION = "3.22.0";

export const MAPBOX_CSP_WORKER_PATH = "/mapbox-gl-csp-worker.js";

/**
 * WebView Android : les workers Mapbox en blob:// échouent souvent → tuiles blanches, marqueurs OK.
 * Appeler avant `new mapboxgl.Map`.
 */
export function configureMapboxWebView(mapbox: typeof mapboxgl): void {
  if (typeof window === "undefined") return;
  if (!needsHttpsMapboxStyleUrl()) return;

  const sameOriginWorker = `${window.location.origin}${MAPBOX_CSP_WORKER_PATH}`;
  mapbox.workerUrl = sameOriginWorker;
}
