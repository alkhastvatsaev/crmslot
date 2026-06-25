"use client";

import MapGalaxyTranscriptionLayer from "@/features/map/components/MapGalaxyTranscriptionLayer";
import { useMobileFooterGalaxyVisible } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";

/** Footer `/m/admin` — dispatch vocal uniquement (pas de profil dupliqué). */
export default function AdminMobileFooterDock() {
  const showGalaxyFooter = useMobileFooterGalaxyVisible();
  const { transcriptionArmed, armTranscription, emitInterventionCreated } = useGalaxyLayerBridge();
  const dispatchVoice = useFeatureFlag("dispatchVoice");
  const showDispatchDock = dispatchVoice && showGalaxyFooter;

  if (!dispatchVoice) return null;

  return (
    <div className="relative h-full min-h-0 w-full" data-testid="admin-mobile-galaxy-dock">
      <MapGalaxyTranscriptionLayer
        hideDockStrip={!showDispatchDock}
        transcriptionArmed={transcriptionArmed}
        onUserPressPlay={armTranscription}
        onInterventionCreated={emitInterventionCreated}
        backgroundTasksEnabled={dispatchVoice && transcriptionArmed}
      />
    </div>
  );
}
