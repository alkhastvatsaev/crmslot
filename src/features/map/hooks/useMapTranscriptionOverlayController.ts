"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  audioSyncedEndIndex,
  computeTranscriptionShownText,
  countWords,
  normalizeTranscriptionAudioUrl,
  TRANSCRIPT_POLL_MS,
  TRANSCRIPT_REVEAL_CHUNK_CHARS,
  TRANSCRIPT_REVEAL_MS_PER_CHAR,
} from "@/features/map/mapTranscriptionReveal";
import type {
  MapTranscriptionAudiosResponse,
  MapTranscriptionOverlayProps,
} from "@/features/map/mapTranscriptionOverlayTypes";

export function useMapTranscriptionOverlayController({
  armed,
  playOpenSignal = 0,
  transcriptTextEnabled = false,
  playbackSync = null,
  scopedClipPublicUrl,
  onVisibleChange,
  forceVisible = false,
}: MapTranscriptionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fullText, setFullText] = useState("");
  const [transcriptSourceUrl, setTranscriptSourceUrl] = useState("");
  const [audioRevealBlocked, setAudioRevealBlocked] = useState(true);
  const [fallbackRevealedLen, setFallbackRevealedLen] = useState(0);
  const [fallbackRevealedWordCount, setFallbackRevealedWordCount] = useState(0);
  const closedForSessionRef = useRef<string | null>(null);
  const currentSessionKeyRef = useRef<string>("");
  const lastTranscriptInSessionRef = useRef<string>("");
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
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  useEffect(() => {
    if (!armed) return;
    if (!playOpenSignal && !forceVisible && !fullText) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    closedForSessionRef.current = null;
  }, [armed, playOpenSignal, forceVisible, fullText]);

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

  useEffect(() => {
    if (!armed || scopedClipPublicUrl === undefined) return;
    const s = scopedClipPublicUrl?.trim() ?? "";
    if (s) return;
    currentSessionKeyRef.current = "";
    lastTranscriptInSessionRef.current = "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullText("");
    setTranscriptSourceUrl("");
    setAudioRevealBlocked(true);
    setFallbackRevealedLen(0);
    setFallbackRevealedWordCount(0);
    hadAudioSyncRef.current = false;
    lastSyncRatioRef.current = 0;
    skipTimerAfterFullAudioRef.current = false;
    freezePartialAfterAudioRef.current = false;
    stopReveal();
  }, [armed, scopedClipPublicUrl, stopReveal]);

  useEffect(() => {
    if (!armed) {
      currentSessionKeyRef.current = "";
      lastTranscriptInSessionRef.current = "";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      setFullText("");
      setTranscriptSourceUrl("");
      setAudioRevealBlocked(true);
      setFallbackRevealedLen(0);
      setFallbackRevealedWordCount(0);
      hadAudioSyncRef.current = false;
      lastSyncRatioRef.current = 0;
      skipTimerAfterFullAudioRef.current = false;
      freezePartialAfterAudioRef.current = false;
      stopReveal();
      return;
    }

    const useScoped = scopedClipPublicUrl !== undefined;
    const scoped = scopedClipPublicUrl?.trim() ?? "";

    let cancelled = false;

    const tick = async () => {
      try {
        if (useScoped && !scoped) return;

        const endpoint = useScoped
          ? `/api/ai/audio-for-url?url=${encodeURIComponent(scoped)}`
          : "/api/ai/latest-audio";

        const res = await fetchWithAuth(endpoint);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as MapTranscriptionAudiosResponse;
        if (data?.decision?.status === "refused" || data?.decision?.status === "created") {
          setVisible(false);
          return;
        }
        const latest = data.audio;
        if (!latest?.transcript?.trim()) return;

        const sessionKey = `${latest.url}:${latest.createdAt}`;
        const trimmed = latest.transcript.trim();

        if (closedForSessionRef.current === sessionKey) {
          if (trimmed !== lastTranscriptInSessionRef.current) {
            lastTranscriptInSessionRef.current = trimmed;
            setFullText(trimmed);
          }
          return;
        }

        if (sessionKey === currentSessionKeyRef.current) {
          if (trimmed === lastTranscriptInSessionRef.current) return;
          const prevText = lastTranscriptInSessionRef.current;
          lastTranscriptInSessionRef.current = trimmed;
          setFullText(trimmed);
          if (trimmed.length < prevText.length) {
            setFallbackRevealedLen(0);
            setFallbackRevealedWordCount(0);
          }
          return;
        }

        if (!cancelled) {
          currentSessionKeyRef.current = sessionKey;
          lastTranscriptInSessionRef.current = trimmed;
          setTranscriptSourceUrl(latest.url);
          setFullText(trimmed);
          setAudioRevealBlocked(true);
          setFallbackRevealedLen(0);
          setFallbackRevealedWordCount(0);
          hadAudioSyncRef.current = false;
          lastSyncRatioRef.current = 0;
          skipTimerAfterFullAudioRef.current = false;
          freezePartialAfterAudioRef.current = false;
        }
      } catch {
        /* ignore */
      }
    };

    tick();
    const id = setInterval(tick, TRANSCRIPT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [armed, stopReveal, scopedClipPublicUrl]);

  const handleClose = useCallback(() => {
    closedForSessionRef.current = currentSessionKeyRef.current || null;
    setVisible(false);
    stopReveal();
  }, [stopReveal]);

  const shown = computeTranscriptionShownText({
    fullText,
    audioSyncActive,
    audioDrivenEndIndex,
    fallbackRevealedLen,
    fallbackRevealedWordCount,
  });

  return {
    visible,
    transcriptTextEnabled,
    fullText,
    shown,
    handleClose,
  };
}
