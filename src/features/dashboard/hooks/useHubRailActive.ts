"use client";

import { useMobileHubLayout } from "@/context/LayoutShellContext";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";

/**
 * Vrai si le rail hub est actif à l'écran.
 * Desktop : toujours true (3 colonnes montées).
 * Mobile : suit `MobileHubRailContext` (un seul rail monté).
 */
export function useHubRailActive(target: MobileHubRail): boolean {
  const mobileHubLayout = useMobileHubLayout();
  const railSnapshot = useMobileHubRailSnapshot();

  if (!mobileHubLayout) return true;
  return railSnapshot?.activeRail === target;
}

/** Vrai si au moins un des rails listés est actif (mobile) ou toujours sur desktop. */
export function useHubAnyRailActive(targets: readonly MobileHubRail[]): boolean {
  const mobileHubLayout = useMobileHubLayout();
  const railSnapshot = useMobileHubRailSnapshot();

  if (!mobileHubLayout) return true;
  const active = railSnapshot?.activeRail;
  return active != null && targets.includes(active);
}
