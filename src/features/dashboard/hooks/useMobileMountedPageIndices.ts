"use client";

import { useEffect, useState } from "react";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";

const MAP_PAGE_INDEX = MOBILE_SHELL_CONTRACT.mapPageIndex;

/**
 * Mobile : page carte toujours montée (WebGL) ; les autres hubs ne montent qu’à la première visite
 * puis restent en mémoire (comme un keep-alive léger).
 */
export function useMobileMountedPageIndices(activePageIndex: number): Set<number> {
  const [mounted, setMounted] = useState<Set<number>>(
    () => new Set([MAP_PAGE_INDEX, activePageIndex])
  );

  useEffect(() => {
    setMounted((prev) => {
      if (prev.has(activePageIndex)) return prev;
      const next = new Set(prev);
      next.add(activePageIndex);
      return next;
    });
  }, [activePageIndex]);

  return mounted;
}
