"use client";

import type { ReactNode } from "react";
import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import BillingHubGalaxyComposer from "@/features/billingHub/components/BillingHubGalaxyComposer";
import CrmHistoryGalaxyComposer from "@/features/crmHistory/components/CrmHistoryGalaxyComposer";
import CompanyStockGalaxyComposer from "@/features/featureHub/components/CompanyStockGalaxyComposer";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

/** Dock Galaxy : saisie agent page-active + transcription audio. */
export default function DashboardGalaxyLayer() {
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();
  const pager = useDashboardPagerOptional();
  const pageIndex = pager?.pageIndex;

  let composer: ReactNode = null;
  if (pageIndex === FEATURE_HUB_SLOT_INDEX) composer = <CompanyStockGalaxyComposer />;
  else if (pageIndex === CRM_HISTORY_SLOT_INDEX) composer = <CrmHistoryGalaxyComposer />;
  else if (pageIndex === BILLING_HUB_SLOT_INDEX) composer = <BillingHubGalaxyComposer />;

  /** Carte (page 0) : dock Galaxy + transcription. Hub Matériel/CRM/Facturation : composer dédié sans doublon. */
  const hideMapGalaxyDockStrip = composer != null;

  return (
    <>
      <MapGalaxyTranscriptionLayer
        hideDockStrip={hideMapGalaxyDockStrip}
        transcriptionArmed={transcriptionArmed}
        onUserPressPlay={armTranscription}
        onInterventionCreated={emitInterventionCreated}
      />
      {composer}
    </>
  );
}
