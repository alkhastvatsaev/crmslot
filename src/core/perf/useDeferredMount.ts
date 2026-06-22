"use client";

import { useEffect, useState } from "react";
import { runWhenIdle, type RunWhenIdleOptions } from "@/core/perf/runWhenIdle";

/** Retourne true une fois le délai + idle écoulés — pour bootstraps / chunks secondaires. */
export function useDeferredMount(options: RunWhenIdleOptions = {}): boolean {
  const minDelayMs = options.minDelayMs ?? 0;
  const idleTimeoutMs = options.idleTimeoutMs ?? 4_000;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    return runWhenIdle(() => setReady(true), { minDelayMs, idleTimeoutMs });
  }, [minDelayMs, idleTimeoutMs, ready]);

  return ready;
}
