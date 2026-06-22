"use client";

import { useEffect, useState } from "react";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";

const MAP_PAGE_INDEX = MOBILE_SHELL_CONTRACT.mapPageIndex;

/**
 * Mobile : hubs visités en keep-alive léger ; la **carte** se démonte dès qu'on quitte
 * la page 0 pour libérer WebGL / GPU (admin + technicien sans carte).
 */
export function useMobileMountedPageIndices(activePageIndex: number): Set<number> {
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([activePageIndex]));

  useEffect(() => {
    setMounted((prev) => {
      let next = prev;

      if (!prev.has(activePageIndex)) {
        next = new Set(prev);
        next.add(activePageIndex);
      }

      if (activePageIndex !== MAP_PAGE_INDEX && next.has(MAP_PAGE_INDEX)) {
        if (next === prev) next = new Set(prev);
        next.delete(MAP_PAGE_INDEX);
      }

      return next;
    });
  }, [activePageIndex]);

  return mounted;
}
