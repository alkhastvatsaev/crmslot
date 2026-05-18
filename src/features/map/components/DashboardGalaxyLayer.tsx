"use client";

import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { AI_ASSISTANT_SLOT_INDEX } from "@/features/ai/aiAssistantConstants";
import ChatbotGalaxyComposer from "@/features/chatbot/components/ChatbotGalaxyComposer";

/** Rendu dans `#dashboard-galaxy-dock` — transcription (défaut) ou chat Chatbot (page 5). */
export default function DashboardGalaxyLayer() {
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();
  const pager = useDashboardPagerOptional();
  const isChatbotPage = pager?.pageIndex === AI_ASSISTANT_SLOT_INDEX;

  if (isChatbotPage) {
    return <ChatbotGalaxyComposer />;
  }

  return (
    <MapGalaxyTranscriptionLayer
      transcriptionArmed={transcriptionArmed}
      onUserPressPlay={armTranscription}
      onInterventionCreated={emitInterventionCreated}
    />
  );
}
