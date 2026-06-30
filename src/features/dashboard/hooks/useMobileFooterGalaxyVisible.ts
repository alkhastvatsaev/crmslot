"use client";

import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useHubRailActive } from "@/features/dashboard/hooks/useHubRailActive";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

const MAP_PAGE_INDEX = 0;

/** Hubs avec agent chatbot sur le rail gauche mobile. */
export const MOBILE_HUB_AGENT_PAGE_INDICES = new Set([
  FEATURE_HUB_SLOT_INDEX,
  CRM_HISTORY_SLOT_INDEX,
  BILLING_HUB_SLOT_INDEX,
]);

/** Rail agent / chatbot actif sur un hub mobile (panneau gauche). */
export function useMobileHubAgentRailActive(): boolean {
  const mobileHubLayout = useMobileHubLayout();
  const pager = useDashboardPagerOptional();
  const railSnapshot = useMobileHubRailSnapshot();
  const leftRailActive = useHubRailActive("left");
  const pageIndex = pager?.pageIndex ?? MAP_PAGE_INDEX;

  if (!mobileHubLayout) return false;
  if (!MOBILE_HUB_AGENT_PAGE_INDICES.has(pageIndex)) return false;
  if (!railSnapshot?.visible || !railSnapshot.rails.includes("left")) return false;
  return leftRailActive;
}

/** Afficher le dock Galaxy (saisie) à la place du calendrier — mobile uniquement. */
export function useMobileFooterGalaxyVisible(): boolean {
  const isMobile = useIsMobile();
  const dispatchVoice = useFeatureFlag("dispatchVoice");
  const pager = useDashboardPagerOptional();
  const bridge = useGalaxyLayerBridgeOptional();
  const agentRailActive = useMobileHubAgentRailActive();
  const pageIndex = pager?.pageIndex ?? MAP_PAGE_INDEX;

  if (isMobile !== true) return false;

  if (pageIndex === MAP_PAGE_INDEX && dispatchVoice && bridge?.transcriptionArmed) {
    return true;
  }

  if (agentRailActive) {
    return true;
  }

  return false;
}
