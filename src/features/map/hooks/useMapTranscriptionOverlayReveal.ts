"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  audioSyncedEndIndex,
  computeTranscriptionShownText,
  countWords,
  normalizeTranscriptionAudioUrl,
  TRANSCRIPT_REVEAL_CHUNK_CHARS,
  TRANSCRIPT_REVEAL_MS_PER_CHAR,
} from "@/features/map/mapTranscriptionReveal";
import type { MapTranscriptionOverlayProps } from "@/features/map/mapTranscriptionOverlayTypes";

type Options = Pick<
  MapTranscriptionOverlayProps,
  "armed" | "playbackSync" | "transcriptTextEnabled"
> & {
  visible: boolean;
  fullText: string;
  transcriptSourceUrl: string;
};

export function useMapTranscriptionOverlayReveal({
  armed,
  visible,
  fullText,
  transcriptSourceUrl,
  transcriptTextEnabled = false,
  playbackSync = null,
}: Options) {
  const [audioRevealBlocked, setAudioRevealBlocked] = useState(true);
  const [fallbackRevealedLen, setFallbackRevealedLen] = useState(0);
  const [fallbackRevealedWordCount, setFallbackRevealedWordCount] = useState(0);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hadAudioSyncRef = useRef(false);
  const lastSyncRatioRef = useRef(0);
  const skipTimerAfterFullAudioRef = useRef(false);
  const freezePartialAfterAudioRef = useRef(false);

  const stopReveal = useCallback(() => {
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const resetRevealState = useCallback(() => {
    setAudioRevealBlocked(true);
    setFallbackRevealedLen(0);
    setFallbackRevealedWordCount(0);
    hadAudioSyncRef.current = false;
    lastSyncRatioRef.current = 0;
    skipTimerAfterFullAudioRef.current = false;
    freezePartialAfterAudioRef.current = false;
    stopReveal();
  }, [stopReveal]);

  const audioSyncActive = Boolean(
    playbackSync &&
    transcriptSourceUrl &&
    normalizeTranscriptionAudioUrl(playbackSync.clipUrl) ===
      normalizeTranscriptionAudioUrl(transcriptSourceUrl) &&
    playbackSync.duration > 0 &&
    !audioRevealBlocked
  );

  useEffect(() => {
    if (!playbackSync || !transcriptSourceUrl) return;
    if (
      normalizeTranscriptionAudioUrl(playbackSync.clipUrl) !==
      normalizeTranscriptionAudioUrl(transcriptSourceUrl)
    ) {
      return;
    }
    if (playbackSync.duration <= 0) return;
    const nearStart =
      playbackSync.currentTime < playbackSync.duration * 0.06 &&
      playbackSync.currentTime < playbackSync.duration - 0.2;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (playbackSync.playing || nearStart) setAudioRevealBlocked(false);
  }, [playbackSync, transcriptSourceUrl]);

  const audioDrivenEndIndex =
    audioSyncActive && playbackSync
      ? audioSyncedEndIndex(fullText, playbackSync.currentTime, playbackSync.duration)
      : 0;

  useEffect(() => {
    if (audioSyncActive) hadAudioSyncRef.current = true;
  }, [audioSyncActive]);

  useEffect(() => {
    if (playbackSync && audioSyncActive && playbackSync.duration > 0) {
      lastSyncRatioRef.current = Math.min(
        1,
        Math.max(0, playbackSync.currentTime / playbackSync.duration)
      );
    }
  }, [playbackSync, audioSyncActive]);

  useEffect(() => {
    if (playbackSync !== null) return;
    if (!hadAudioSyncRef.current || !fullText) return;
    hadAudioSyncRef.current = false;
    const ratio = lastSyncRatioRef.current;
    lastSyncRatioRef.current = 0;
    const tw = countWords(fullText);
    if (tw <= 1) {
      const len = Math.min(fullText.length, Math.floor(fullText.length * Math.min(1, ratio)));
      setFallbackRevealedLen(len);
    } else {
      const wc = Math.min(tw, Math.floor(ratio * tw));
      setFallbackRevealedWordCount(wc);
    }
    if (ratio >= 0.995) skipTimerAfterFullAudioRef.current = true;
    else if (ratio > 0) freezePartialAfterAudioRef.current = true;
  }, [playbackSync, fullText]);

  useEffect(() => () => stopReveal(), [stopReveal]);

  useEffect(() => {
    if (!armed || !visible || !fullText || !transcriptTextEnabled) {
      stopReveal();
      return;
    }
    if (audioSyncActive) {
      stopReveal();
      return;
    }
    if (skipTimerAfterFullAudioRef.current) {
      skipTimerAfterFullAudioRef.current = false;
      stopReveal();
      return;
    }
    if (freezePartialAfterAudioRef.current) {
      freezePartialAfterAudioRef.current = false;
      stopReveal();
      return;
    }

    stopReveal();
    setFallbackRevealedLen(0);
    setFallbackRevealedWordCount(0);
    const tw = countWords(fullText);
    revealTimerRef.current = setInterval(() => {
      if (tw <= 1) {
        setFallbackRevealedLen((prev) => {
          const next = Math.min(fullText.length, prev + TRANSCRIPT_REVEAL_CHUNK_CHARS);
          if (next >= fullText.length && revealTimerRef.current) {
            clearInterval(revealTimerRef.current);
            revealTimerRef.current = null;
          }
          return next;
        });
      } else {
        setFallbackRevealedWordCount((prev) => {
          const next = Math.min(tw, prev + 1);
          if (next >= tw && revealTimerRef.current) {
            clearInterval(revealTimerRef.current);
            revealTimerRef.current = null;
          }
          return next;
        });
      }
    }, TRANSCRIPT_REVEAL_MS_PER_CHAR);

    return () => stopReveal();
  }, [armed, visible, fullText, transcriptTextEnabled, audioSyncActive, stopReveal]);

  const shown = computeTranscriptionShownText({
    fullText,
    audioSyncActive,
    audioDrivenEndIndex,
    fallbackRevealedLen,
    fallbackRevealedWordCount,
  });

  return { shown, stopReveal, resetRevealState };
}
