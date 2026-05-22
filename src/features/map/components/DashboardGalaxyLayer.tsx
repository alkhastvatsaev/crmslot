"use client";

import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import ChatbotGalaxyComposer from "@/features/chatbot/components/ChatbotGalaxyComposer";
import CompanyStockGalaxyComposer from "@/features/featureHub/components/CompanyStockGalaxyComposer";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

/** Dock Galaxy : saisie page-active (matériel / chatbot) + transcription audio. */
export default function DashboardGalaxyLayer() {
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();
  const pager = useDashboardPagerOptional();
  const isMaterialPage = pager?.pageIndex === FEATURE_HUB_SLOT_INDEX;

  return (
    <>
      <MapGalaxyTranscriptionLayer
        hideDockStrip
        transcriptionArmed={transcriptionArmed}
        onUserPressPlay={armTranscription}
        onInterventionCreated={emitInterventionCreated}
      />
      {isMaterialPage ? <CompanyStockGalaxyComposer /> : <ChatbotGalaxyComposer />}
    </>
  );
}
