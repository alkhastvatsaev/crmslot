"use client";

import React from "react";
import {
  type AiPlaybackSync,
  useAiAudioPlayback,
} from "@/features/dispatch/hooks/useAiAudioPlayback";
import AiAssistantStrip from "@/features/dispatch/components/AiAssistantStrip";
import type { QueuedClip } from "@/features/dispatch/audioUtils";

export type { AiPlaybackSync };
export type { QueuedClip };

type AiAssistantProps = {
  /** Bande dans le dock (largeur colonne centre = carte), pas en flottant viewport. */
  dockLayout?: boolean;
  /** Logique audio / file conservée ; pas de rendu Galaxy (dock réservé au Chatbot). */
  headless?: boolean;
  onUserPressPlay?: () => void;
  onPlaybackSync?: (sync: AiPlaybackSync) => void;
  onActiveClipUrlChange?: (clipPublicUrl: string | null) => void;
  transcriptOverlayVisible?: boolean;
  onUserLongPress?: () => void;
  onQueueChange?: (queue: QueuedClip[]) => void;
  backgroundTasksEnabled?: boolean;
  mobilePowerSave?: boolean;
};

export default function AiAssistant({
  dockLayout = false,
  headless = false,
  onUserPressPlay,
  onPlaybackSync,
  onActiveClipUrlChange,
  transcriptOverlayVisible = false,
  onUserLongPress,
  onQueueChange,
  backgroundTasksEnabled = true,
  mobilePowerSave,
}: AiAssistantProps = {}) {
  const { queue, isPlaying, startPlayback, stopPlayback } = useAiAudioPlayback({
    onUserPressPlay,
    onPlaybackSync,
    onActiveClipUrlChange,
    onQueueChange,
    backgroundTasksEnabled,
  });

  const togglePlayback = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (isPlaying) stopPlayback();
    else startPlayback();
  };

  if (headless) {
    return null;
  }

  return (
    <AiAssistantStrip
      dockLayout={dockLayout}
      isPlaying={isPlaying}
      queueLength={queue.length}
      transcriptOverlayVisible={transcriptOverlayVisible}
      onTogglePlayback={togglePlayback}
      onUserLongPress={onUserLongPress}
      mobilePowerSave={mobilePowerSave}
    />
  );
}
