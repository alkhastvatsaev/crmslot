"use client";

import type { ReactNode } from "react";
import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useMobileFooterGalaxyVisible } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import BillingHubGalaxyComposer from "@/features/billingHub/components/BillingHubGalaxyComposer";
import CrmHistoryGalaxyComposer from "@/features/crmHistory/components/CrmHistoryGalaxyComposer";
import CompanyStockGalaxyComposer from "@/features/featureHub/components/CompanyStockGalaxyComposer";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

const MAP_PAGE_INDEX = 0;

/** Footer mobile admin — Galaxy (saisie / dispatch) seulement si actif. */
export default function MobileShellFooterDock() {
  const showGalaxyFooter = useMobileFooterGalaxyVisible();
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();
  const pager = useDashboardPagerOptional();
  const pageIndex = pager?.pageIndex ?? MAP_PAGE_INDEX;
  const dispatchVoice = useFeatureFlag("dispatchVoice");

  let hubComposer: ReactNode = null;
  if (pageIndex === FEATURE_HUB_SLOT_INDEX) hubComposer = <CompanyStockGalaxyComposer />;
  else if (pageIndex === CRM_HISTORY_SLOT_INDEX) hubComposer = <CrmHistoryGalaxyComposer />;
  else if (pageIndex === BILLING_HUB_SLOT_INDEX) hubComposer = <BillingHubGalaxyComposer />;

  const showHubComposer = hubComposer != null && showGalaxyFooter;
  const showDispatchDock =
    dispatchVoice && pageIndex === MAP_PAGE_INDEX && showGalaxyFooter && !showHubComposer;
  const audioBackgroundTasksEnabled = Boolean(dispatchVoice);

  return (
    <div className="relative h-full w-full min-h-0">
      {dispatchVoice ? (
        <MapGalaxyTranscriptionLayer
          hideDockStrip={!showDispatchDock}
          transcriptionArmed={transcriptionArmed}
          onUserPressPlay={armTranscription}
          onInterventionCreated={emitInterventionCreated}
          backgroundTasksEnabled={audioBackgroundTasksEnabled}
          mobilePowerSave={false}
        />
      ) : null}
      {showHubComposer ? hubComposer : null}
    </div>
  );
}
