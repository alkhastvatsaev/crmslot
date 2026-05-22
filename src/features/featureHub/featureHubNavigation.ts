import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

export function navigateFeatureHub(pager: DashboardPagerApi | null | undefined): void {
  if (!pager) return;
  pager.setPageIndex(FEATURE_HUB_SLOT_INDEX);
}
