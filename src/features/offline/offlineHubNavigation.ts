import type { DashboardPagerApi } from "@/features/dashboard";
import { OFFLINE_HUB_SLOT_INDEX } from "@/features/offline/offlineHubConstants";

export const OFFLINE_HUB_ANCHOR_SYNC = "offline-hub-sync";
export const OFFLINE_HUB_ANCHOR_CACHE = "offline-hub-cache";

export function navigateOfflineHub(
  pager: DashboardPagerApi | null | undefined,
  anchor?: string
): void {
  if (!pager) return;
  const wasOnHub = pager.pageIndex === OFFLINE_HUB_SLOT_INDEX;
  pager.setPageIndex(OFFLINE_HUB_SLOT_INDEX);
  if (!anchor || typeof document === "undefined") return;
  const run = () =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (wasOnHub) {
    requestAnimationFrame(() => requestAnimationFrame(run));
  } else {
    window.setTimeout(run, 520);
  }
}
