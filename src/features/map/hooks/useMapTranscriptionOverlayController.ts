"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMapTranscriptionOverlayPoll } from "@/features/map/hooks/useMapTranscriptionOverlayPoll";
import { useMapTranscriptionOverlayReveal } from "@/features/map/hooks/useMapTranscriptionOverlayReveal";
import type { MapTranscriptionOverlayProps } from "@/features/map/mapTranscriptionOverlayTypes";

export function useMapTranscriptionOverlayController({
  armed,
  playOpenSignal = 0,
  transcriptTextEnabled = false,
  playbackSync = null,
  scopedClipPublicUrl,
  onVisibleChange,
  forceVisible = false,
  onVoiceReviewComplete,
}: MapTranscriptionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const resetRevealRef = useRef<(() => void) | null>(null);

  const onTranscriptReset = useCallback(() => {
    resetRevealRef.current?.();
  }, []);

  const onDecisionRefused = useCallback(() => {
    setVisible(false);
    onVoiceReviewComplete?.();
  }, [onVoiceReviewComplete]);

  const poll = useMapTranscriptionOverlayPoll({
    armed,
    scopedClipPublicUrl,
    onTranscriptReset,
    onDecisionRefused,
  });

  const reveal = useMapTranscriptionOverlayReveal({
    armed,
    visible,
    fullText: poll.fullText,
    transcriptSourceUrl: poll.transcriptSourceUrl,
    transcriptTextEnabled,
    playbackSync,
  });

  resetRevealRef.current = reveal.resetRevealState;

  useEffect(() => {
    if (!armed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
    }
  }, [armed]);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  useEffect(() => {
    if (!armed) return;
    if (!playOpenSignal && !forceVisible && !poll.fullText) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    poll.clearClosedSession();
  }, [armed, playOpenSignal, forceVisible, poll.fullText, poll.clearClosedSession]);

  const handleClose = useCallback(() => {
    poll.closeSession();
    setVisible(false);
    reveal.stopReveal();
  }, [poll.closeSession, reveal.stopReveal]);

  return {
    visible,
    transcriptTextEnabled,
    fullText: poll.fullText,
    shown: reveal.shown,
    handleClose,
  };
}
