"use client";

import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

/** Vrai quand la page hub est visible (desktop ou mobile). */
export function useHubPageActive(slotIndex: number): boolean {
  const pager = useDashboardPagerOptional();
  return pager == null || pager.pageIndex === slotIndex;
}
