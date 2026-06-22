export type LivePerfProbeSnapshot = {
  fps: number;
  rafPerSec: number;
  activeIntervals: number;
  longTasksLast5s: number;
  longTaskMsLast5s: number;
  mountedHubPages: number;
  suspendedHubPages: number;
  documentHidden: boolean;
  serviceWorkerActive: boolean;
  connectionType: string;
  gitSha: string;
};

type Listener = (snap: LivePerfProbeSnapshot) => void;

const state = {
  installed: false,
  rafCount: 0,
  fps: 0,
  frameCount: 0,
  lastFpsAt: 0,
  activeIntervals: new Set<number>(),
  longTaskCount: 0,
  longTaskMs: 0,
  longTaskWindowStart: 0,
  listeners: new Set<Listener>(),
};

function resetLongTaskWindow(now: number) {
  if (now - state.longTaskWindowStart >= 5_000) {
    state.longTaskCount = 0;
    state.longTaskMs = 0;
    state.longTaskWindowStart = now;
  }
}

function readDomHubCounts(): { mounted: number; suspended: number } {
  if (typeof document === "undefined") return { mounted: 0, suspended: 0 };
  const panels = document.querySelectorAll('[data-testid^="mobile-page-"]');
  let mounted = 0;
  let suspended = 0;
  panels.forEach((el) => {
    if (el.getAttribute("aria-hidden") === "true") suspended += 1;
    else mounted += 1;
  });
  return { mounted, suspended };
}

export function buildLivePerfProbeSnapshot(): LivePerfProbeSnapshot {
  const now = performance.now();
  resetLongTaskWindow(now);
  const hubs = readDomHubCounts();
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const conn =
    nav && "connection" in nav
      ? (nav as Navigator & { connection?: { effectiveType?: string } }).connection
      : null;

  return {
    fps: Math.round(state.fps),
    rafPerSec: state.rafCount,
    activeIntervals: state.activeIntervals.size,
    longTasksLast5s: state.longTaskCount,
    longTaskMsLast5s: Math.round(state.longTaskMs),
    mountedHubPages: hubs.mounted,
    suspendedHubPages: hubs.suspended,
    documentHidden: typeof document !== "undefined" ? document.hidden : false,
    serviceWorkerActive:
      typeof navigator !== "undefined" && "serviceWorker" in navigator
        ? Boolean(navigator.serviceWorker.controller)
        : false,
    connectionType: conn?.effectiveType ?? "unknown",
    gitSha:
      document.querySelector('meta[name="application-git-sha"]')?.getAttribute("content")?.trim() ??
      process.env.NEXT_PUBLIC_APP_GIT_SHA ??
      "?",
  };
}

export function subscribeLivePerfProbe(listener: Listener): () => void {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

function emitProbe() {
  const snap = buildLivePerfProbeSnapshot();
  state.listeners.forEach((l) => l(snap));
}

export function installLivePerfProbe(): void {
  if (typeof window === "undefined" || state.installed) return;
  state.installed = true;
  state.lastFpsAt = performance.now();
  state.longTaskWindowStart = performance.now();

  const origSetInterval = window.setInterval.bind(window);
  const origClearInterval = window.clearInterval.bind(window);
  window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    const id = origSetInterval(handler, timeout, ...args) as unknown as number;
    state.activeIntervals.add(id);
    return id;
  }) as typeof window.setInterval;
  window.clearInterval = ((id: number) => {
    state.activeIntervals.delete(id);
    origClearInterval(id);
  }) as typeof window.clearInterval;

  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    state.rafCount += 1;
    return origRaf(cb);
  };

  const fpsLoop = (now: number) => {
    state.frameCount += 1;
    if (now - state.lastFpsAt >= 1_000) {
      state.fps = (state.frameCount * 1_000) / (now - state.lastFpsAt);
      state.frameCount = 0;
      state.rafCount = 0;
      state.lastFpsAt = now;
      resetLongTaskWindow(now);
      emitProbe();
    }
    origRaf(fpsLoop);
  };
  origRaf(fpsLoop);

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.longTaskCount += 1;
        state.longTaskMs += entry.duration;
      }
    });
    po.observe({ type: "longtask", buffered: true });
  } catch {
    /* Safari iOS : longtask parfois indisponible */
  }

  origSetInterval(() => emitProbe(), 500);
}
