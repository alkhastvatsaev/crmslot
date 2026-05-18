import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";

export const MAP_CAROUSEL_PAGE_INDEX = 0;

export function openBackofficeIntervention(
  pager: DashboardPagerApi | null | undefined,
  setPendingInboxId: ((id: string | null) => void) | undefined,
  interventionId: string,
): void {
  const id = interventionId.trim();
  if (!id) return;
  pager?.setPageIndex(MAP_CAROUSEL_PAGE_INDEX);
  setPendingInboxId?.(id);
}
