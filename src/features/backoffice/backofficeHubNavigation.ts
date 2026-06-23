import type { DashboardPagerApi } from "@/features/dashboard";
import { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";

export const BACKOFFICE_HUB_ANCHOR_DUPLICATES = "backoffice-hub-duplicates";
export const BACKOFFICE_HUB_ANCHOR_DASHBOARD = "backoffice-hub-dashboard";
export const BACKOFFICE_HUB_ANCHOR_CALENDAR = "backoffice-hub-calendar";

export function navigateBackOfficeHub(
  pager: DashboardPagerApi | null | undefined,
  anchor?: string
): void {
  if (!pager) return;
  const wasOnHub = pager.pageIndex === BACKOFFICE_HUB_SLOT_INDEX;
  pager.setPageIndex(BACKOFFICE_HUB_SLOT_INDEX);
  if (!anchor || typeof document === "undefined") return;
  const run = () =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (wasOnHub) {
    requestAnimationFrame(() => requestAnimationFrame(run));
  } else {
    window.setTimeout(run, 520);
  }
}
