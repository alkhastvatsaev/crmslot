"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Mobile thermique : une seule page hub montée (démontage réel hors écran).
 * La carte n’est plus keep-alive — WebGL + arbre React libérés sur les autres hubs.
 */
export const MOBILE_MOUNTED_HUB_MAX = 1;

/** @deprecated TTL LRU retiré — une page active uniquement. */
export const MOBILE_MOUNTED_HUB_TTL_MS = 0;

function computeMountedIndices(activePageIndex: number): Set<number> {
  return new Set([activePageIndex]);
}

/** @internal — test pur sans React. */
export function computeMobileMountedPageIndices(
  activePageIndex: number,
  _lastActiveSeq: ReadonlyMap<number, number> = new Map(),
  _lastActiveAtMs: ReadonlyMap<number, number> = new Map(),
  _now: number = 0
): Set<number> {
  return computeMountedIndices(activePageIndex);
}

export function useMobileMountedPageIndices(activePageIndex: number): Set<number> {
  const [mounted, setMounted] = useState<Set<number>>(() => computeMountedIndices(activePageIndex));

  const syncMounted = useCallback((pageIndex: number) => {
    setMounted(computeMountedIndices(pageIndex));
  }, []);

  useEffect(() => {
    syncMounted(activePageIndex);
  }, [activePageIndex, syncMounted]);

  return mounted;
}
