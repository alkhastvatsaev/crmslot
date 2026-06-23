"use client";

import React from "react";
import MapTranscriptionOverlayView from "@/features/map/components/MapTranscriptionOverlayView";
import { useMapTranscriptionOverlayController } from "@/features/map/hooks/useMapTranscriptionOverlayController";
import type { MapTranscriptionOverlayProps } from "@/features/map/mapTranscriptionOverlayTypes";

// Réexport utilitaires (tests / imports existants potentiels)
export {
  TRANSCRIPT_POLL_MS,
  TRANSCRIPT_REVEAL_CHUNK_CHARS,
  TRANSCRIPT_REVEAL_MS_PER_CHAR,
  audioSyncedEndIndex,
  countWords,
  endIndexAfterWordCount,
} from "@/features/map/mapTranscriptionReveal";

function MapTranscriptionOverlayInner(props: MapTranscriptionOverlayProps) {
  const c = useMapTranscriptionOverlayController(props);

  if (!c.visible) return null;

  return (
    <MapTranscriptionOverlayView
      transcriptTextEnabled={c.transcriptTextEnabled}
      fullText={c.fullText}
      shown={c.shown}
      onClose={c.handleClose}
    />
  );
}

export default React.memo(MapTranscriptionOverlayInner);
