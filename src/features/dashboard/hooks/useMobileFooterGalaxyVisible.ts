"use client";

import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useMobileGalaxyComposerOpen } from "@/context/MobileGalaxyComposerOpenContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

const MAP_PAGE_INDEX = 0;

const HUB_COMPOSER_PAGE_INDICES = new Set([
  FEATURE_HUB_SLOT_INDEX,
  CRM_HISTORY_SLOT_INDEX,
  BILLING_HUB_SLOT_INDEX,
]);

/** Afficher le dock Galaxy (saisie) au lieu du profil — mobile uniquement. */
export function useMobileFooterGalaxyVisible(): boolean {
  const isMobile = useIsMobile();
  const composerOpen = useMobileGalaxyComposerOpen();
  const dispatchVoice = useFeatureFlag("dispatchVoice");
  const pager = useDashboardPagerOptional();
  const bridge = useGalaxyLayerBridgeOptional();
  const pageIndex = pager?.pageIndex ?? MAP_PAGE_INDEX;

  if (isMobile !== true) return false;

  if (pageIndex === MAP_PAGE_INDEX && dispatchVoice && bridge?.transcriptionArmed) {
    return true;
  }

  if (HUB_COMPOSER_PAGE_INDICES.has(pageIndex) && composerOpen) {
    return true;
  }

  return false;
}
