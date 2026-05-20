"use client";

import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import ChatbotGalaxyComposer from "@/features/chatbot/components/ChatbotGalaxyComposer";

/** Dock Galaxy : saisie Chatbot (toutes les pages) + transcription audio (overlays). */
export default function DashboardGalaxyLayer() {
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();

  return (
    <>
      <MapGalaxyTranscriptionLayer
        hideDockStrip
        transcriptionArmed={transcriptionArmed}
        onUserPressPlay={armTranscription}
        onInterventionCreated={emitInterventionCreated}
      />
      <ChatbotGalaxyComposer />
    </>
  );
}
