"use client";

import { useMobilePageTransition } from "@/features/dashboard/hooks/useMobilePageTransition";
import { computeMobileMountedPageIndices } from "@/features/dashboard/mobilePageTransition";

/**
 * Mobile thermique : une seule page hub montée au repos (démontage réel hors écran).
 * Pendant une transition (~380 ms), l'ancienne page reste montée pour l'animation.
 */
export const MOBILE_MOUNTED_HUB_MAX = 1;

/** @deprecated TTL LRU retiré — une page active uniquement. */
export const MOBILE_MOUNTED_HUB_TTL_MS = 0;

export { computeMobileMountedPageIndices };

export function useMobileMountedPageIndices(activePageIndex: number): Set<number> {
  return useMobilePageTransition(activePageIndex).mountedIndices;
}
