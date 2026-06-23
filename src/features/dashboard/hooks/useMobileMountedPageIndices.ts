"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";

const MAP_PAGE_INDEX = MOBILE_SHELL_CONTRACT.mapPageIndex;

/** Carte + au plus 2 hubs visités récemment. */
export const MOBILE_MOUNTED_HUB_MAX = 3;
/** Hubs hors carte démontés après inactivité. */
export const MOBILE_MOUNTED_HUB_TTL_MS = 5 * 60 * 1000;
const PRUNE_INTERVAL_MS = 30_000;

function computeMountedIndices(
  activePageIndex: number,
  lastActiveSeq: ReadonlyMap<number, number>,
  lastActiveAtMs: ReadonlyMap<number, number>,
  now: number
): Set<number> {
  const mounted = new Set<number>([MAP_PAGE_INDEX]);
  if (activePageIndex !== MAP_PAGE_INDEX) {
    mounted.add(activePageIndex);
  }

  const candidates: { index: number; seq: number }[] = [];
  for (const [index, seq] of lastActiveSeq) {
    if (index === MAP_PAGE_INDEX || index === activePageIndex) continue;
    const at = lastActiveAtMs.get(index) ?? 0;
    if (now - at > MOBILE_MOUNTED_HUB_TTL_MS) continue;
    candidates.push({ index, seq });
  }
  candidates.sort((a, b) => b.seq - a.seq);

  const budget = MOBILE_MOUNTED_HUB_MAX - mounted.size;
  for (let i = 0; i < Math.min(budget, candidates.length); i++) {
    const entry = candidates[i];
    if (entry) mounted.add(entry.index);
  }

  return mounted;
}

/** @internal — test pur LRU/TTL sans React. */
export function computeMobileMountedPageIndices(
  activePageIndex: number,
  lastActiveSeq: ReadonlyMap<number, number>,
  lastActiveAtMs: ReadonlyMap<number, number>,
  now: number
): Set<number> {
  return computeMountedIndices(activePageIndex, lastActiveSeq, lastActiveAtMs, now);
}

/**
 * Mobile : carte toujours montée ; autres hubs lazy avec LRU (max 3) et TTL 5 min.
 */
export function useMobileMountedPageIndices(activePageIndex: number): Set<number> {
  const visitSeqRef = useRef(0);
  const lastActiveSeqRef = useRef<Map<number, number>>(new Map());
  const lastActiveAtMsRef = useRef<Map<number, number>>(new Map());
  const [mounted, setMounted] = useState<Set<number>>(() =>
    computeMountedIndices(
      activePageIndex,
      lastActiveSeqRef.current,
      lastActiveAtMsRef.current,
      Date.now()
    )
  );

  const syncMounted = useCallback((pageIndex: number) => {
    const now = Date.now();
    visitSeqRef.current += 1;
    lastActiveSeqRef.current.set(pageIndex, visitSeqRef.current);
    lastActiveAtMsRef.current.set(pageIndex, now);
    setMounted(
      computeMountedIndices(pageIndex, lastActiveSeqRef.current, lastActiveAtMsRef.current, now)
    );
  }, []);

  useEffect(() => {
    syncMounted(activePageIndex);
  }, [activePageIndex, syncMounted]);

  useEffect(() => {
    const id = window.setInterval(() => {
      syncMounted(activePageIndex);
    }, PRUNE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [activePageIndex, syncMounted]);

  return mounted;
}
