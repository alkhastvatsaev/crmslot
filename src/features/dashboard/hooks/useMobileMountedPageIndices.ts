"use client";

import { useEffect, useMemo, useState } from "react";
import { MOBILE_SHELL_CONTRACT } from "@/features/dashboard/mobileShellContract";
import { useMobileEmergencyLite } from "@/core/perf/useMobileEmergencyLite";

const MAP_PAGE_INDEX = MOBILE_SHELL_CONTRACT.mapPageIndex;

/**
 * Mobile : page carte toujours montée (retour instantané) ; autres hubs lazy keep-alive.
 * Mode urgence (`mobileEmergencyLite`) : **un seul hub** à la fois (perf / batterie).
 */
export function useMobileMountedPageIndices(activePageIndex: number): Set<number> {
  const emergencyLite = useMobileEmergencyLite();

  const emergencySet = useMemo(() => new Set([activePageIndex]), [activePageIndex]);

  const [mounted, setMounted] = useState<Set<number>>(
    () => new Set([MAP_PAGE_INDEX, activePageIndex])
  );

  useEffect(() => {
    if (emergencyLite) return;
    setMounted((prev) => {
      if (prev.has(activePageIndex)) return prev;
      const next = new Set(prev);
      next.add(activePageIndex);
      return next;
    });
  }, [activePageIndex, emergencyLite]);

  if (emergencyLite) {
    return emergencySet;
  }

  return mounted;
}
