import { isAndroidUserAgent } from "@/features/map/mapboxPowerProfile";

export type MapboxDeviceTier = "low" | "standard" | "high";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { effectiveType?: string };
};

/** Heuristique matériel mobile — affine cache tuiles, DPR et garde-fous WebGL. */
export function resolveMapboxDeviceTier(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  nav: NavigatorWithHints = typeof navigator !== "undefined" ? navigator : ({} as Navigator)
): MapboxDeviceTier {
  const memoryGb = nav.deviceMemory;
  const cores = nav.hardwareConcurrency ?? 0;
  const android = isAndroidUserAgent(userAgent);
  const ios = /iPhone|iPod/i.test(userAgent);
  const slowNetwork =
    nav.connection?.effectiveType === "slow-2g" ||
    nav.connection?.effectiveType === "2g" ||
    nav.connection?.effectiveType === "3g";

  if (memoryGb != null && memoryGb <= 2) return "low";
  if (cores > 0 && cores <= 4 && android) return "low";
  if (slowNetwork) return "low";

  if (ios && /iPhone OS (1[0-4]|9)_/i.test(userAgent)) return "low";
  if (android && /Android [4-8]\./i.test(userAgent)) return "low";

  if (memoryGb != null && memoryGb >= 6 && cores >= 8) return "high";
  if (!android && ios && cores >= 6) return "high";

  return "standard";
}

export type MapboxPerfSample = {
  tier: MapboxDeviceTier;
  initMs: number | null;
  loadMs: number | null;
  userAgent: string;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
};

export function markMapboxPerf(stage: "init-start" | "init-end" | "load"): void {
  if (typeof performance === "undefined") return;
  performance.mark(`mapbox-${stage}`);
}

export function measureMapboxPerf(tier: MapboxDeviceTier): MapboxPerfSample {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  let initMs: number | null = null;
  let loadMs: number | null = null;

  if (typeof performance !== "undefined") {
    try {
      const init = performance.measure("mapbox-init", "mapbox-init-start", "mapbox-init-end");
      initMs = Math.round(init.duration);
    } catch {
      /* marks absents */
    }
    try {
      const load = performance.measure("mapbox-load", "mapbox-init-start", "mapbox-load");
      loadMs = Math.round(load.duration);
    } catch {
      /* marks absents */
    }
  }

  return {
    tier,
    initMs,
    loadMs,
    userAgent: nav?.userAgent ?? "",
    deviceMemoryGb:
      nav && "deviceMemory" in nav && typeof nav.deviceMemory === "number"
        ? nav.deviceMemory
        : null,
    hardwareConcurrency: nav?.hardwareConcurrency ?? null,
  };
}
