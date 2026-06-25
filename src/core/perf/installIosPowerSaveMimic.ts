/** Bride requestAnimationFrame — approximation du throttle WebKit en mode économie d’énergie iOS. */

let installed = false;

export function installIosPowerSaveMimic(targetFps: number): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  const fps = Math.min(60, Math.max(10, targetFps));
  const minFrameMs = 1000 / fps;

  document.documentElement.dataset.lpmMimic = String(fps);

  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);

  type Entry = { id: number; cb: FrameRequestCallback };
  let nextId = 1;
  const liveIds = new Set<number>();
  let queue: Entry[] = [];
  let pumpScheduled = false;
  let lastFrameAt = 0;

  const drainQueue = (timestamp: number) => {
    pumpScheduled = false;
    const batch = queue;
    queue = [];
    for (const entry of batch) {
      if (!liveIds.has(entry.id)) continue;
      liveIds.delete(entry.id);
      entry.cb(timestamp);
    }
    if (queue.length > 0) schedulePump();
  };

  const schedulePump = () => {
    if (pumpScheduled) return;
    pumpScheduled = true;
    nativeRaf((timestamp) => {
      if (lastFrameAt > 0 && timestamp - lastFrameAt < minFrameMs) {
        pumpScheduled = false;
        schedulePump();
        return;
      }
      lastFrameAt = timestamp;
      drainQueue(timestamp);
    });
  };

  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const id = nextId++;
    liveIds.add(id);
    queue.push({ id, cb });
    schedulePump();
    return id;
  };

  window.cancelAnimationFrame = (id: number) => {
    liveIds.delete(id);
  };

  // Évite de laisser l’ancienne impl si un autre patch (ex. sonde perf) s’installe après.
  void nativeCancel;
}
