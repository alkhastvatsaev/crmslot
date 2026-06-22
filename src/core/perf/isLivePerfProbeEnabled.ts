/** Sonde perf live — `?perf=1` ou localStorage `crmslot:perf=1` ou env build. */
export function isLivePerfProbeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_LIVE_PERF_PROBE === "true") return true;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("perf") === "1") {
      window.localStorage.setItem("crmslot:perf", "1");
      return true;
    }
    if (window.localStorage.getItem("crmslot:perf") === "1") return true;
  } catch {
    /* private mode */
  }

  return false;
}

export function disableLivePerfProbe(): void {
  try {
    window.localStorage.removeItem("crmslot:perf");
  } catch {
    /* ignore */
  }
}
