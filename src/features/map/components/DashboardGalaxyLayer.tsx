"use client";

import type { ReactNode } from "react";
import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import BillingHubGalaxyComposer from "@/features/billingHub/components/BillingHubGalaxyComposer";
import CrmHistoryGalaxyComposer from "@/features/crmHistory/components/CrmHistoryGalaxyComposer";
import CompanyStockGalaxyComposer from "@/features/featureHub/components/CompanyStockGalaxyComposer";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

const MAP_HUB_SLOT_INDEX = 0;

/** Dock Galaxy : saisie agent page-active + transcription audio. */
export default function DashboardGalaxyLayer() {
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();
  const pager = useDashboardPagerOptional();
  const pageIndex = pager?.pageIndex;
  const isMobile = useIsMobile();

  let hubComposer: ReactNode = null;
  if (pageIndex === FEATURE_HUB_SLOT_INDEX) hubComposer = <CompanyStockGalaxyComposer />;
  else if (pageIndex === CRM_HISTORY_SLOT_INDEX) hubComposer = <CrmHistoryGalaxyComposer />;
  else if (pageIndex === BILLING_HUB_SLOT_INDEX) hubComposer = <BillingHubGalaxyComposer />;

  const hideMapGalaxyDockStrip = hubComposer != null;
  const audioBackgroundTasksEnabled = isMobile !== true || transcriptionArmed;

  return (
    <>
      <MapGalaxyTranscriptionLayer
        hideDockStrip={hideMapGalaxyDockStrip}
        transcriptionArmed={transcriptionArmed}
        onUserPressPlay={armTranscription}
        onInterventionCreated={emitInterventionCreated}
        backgroundTasksEnabled={audioBackgroundTasksEnabled}
        mobilePowerSave={isMobile === true}
      />
      {hubComposer}
    </>
  );
}
