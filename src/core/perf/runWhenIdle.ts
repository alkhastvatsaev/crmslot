export type RunWhenIdleOptions = {
  /** Délai minimum avant exécution (ms). */
  minDelayMs?: number;
  /** Timeout requestIdleCallback (ms) — exécution forcée si le thread reste occupé. */
  idleTimeoutMs?: number;
};

/**
 * Planifie du travail non critique après le premier paint + idle (ou timeout).
 * Fallback setTimeout si requestIdleCallback indisponible (Safari ancien, WebView).
 */
export function runWhenIdle(task: () => void, options: RunWhenIdleOptions = {}): () => void {
  if (typeof window === "undefined") return () => {};

  const minDelayMs = options.minDelayMs ?? 0;
  const idleTimeoutMs = options.idleTimeoutMs ?? 4_000;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    task();
  };

  const scheduleIdle = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => run(), { timeout: idleTimeoutMs });
      return () => window.cancelIdleCallback(idleId);
    }
    const fallbackId = window.setTimeout(run, Math.min(idleTimeoutMs, 1_500));
    return () => window.clearTimeout(fallbackId);
  };

  let cancelIdle: (() => void) | undefined;
  const delayId = window.setTimeout(() => {
    cancelIdle = scheduleIdle();
  }, minDelayMs);

  return () => {
    cancelled = true;
    window.clearTimeout(delayId);
    cancelIdle?.();
  };
}
