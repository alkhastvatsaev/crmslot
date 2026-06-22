"use client";

import { useCallback, useEffect, useRef } from "react";
import type { UseAiAudioPlaybackOptions } from "@/features/dispatch/aiAudioPlaybackTypes";
import type { QueuedClip } from "@/features/dispatch/audioUtils";

export function useAiAudioPlaybackSync(
  queueRef: React.MutableRefObject<QueuedClip[]>,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  bufferSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
  bufferMetaRef: React.MutableRefObject<{
    startCtxTime: number;
    duration: number;
    clipUrl: string;
  } | null>,
  mountedRef: React.MutableRefObject<boolean>,
  onPlaybackSync?: UseAiAudioPlaybackOptions["onPlaybackSync"],
  onActiveClipUrlChange?: UseAiAudioPlaybackOptions["onActiveClipUrlChange"]
) {
  const onPlaybackSyncRef = useRef(onPlaybackSync);
  const onActiveClipUrlChangeRef = useRef(onActiveClipUrlChange);
  const playbackRafRef = useRef(0);

  useEffect(() => {
    onPlaybackSyncRef.current = onPlaybackSync;
  }, [onPlaybackSync]);

  useEffect(() => {
    onActiveClipUrlChangeRef.current = onActiveClipUrlChange;
  }, [onActiveClipUrlChange]);

  const flushPlaybackSync = useCallback(() => {
    const cb = onPlaybackSyncRef.current;
    if (!cb) return;
    const head = queueRef.current[0];
    const ctx = audioContextRef.current;
    const bufMeta = bufferMetaRef.current;
    if (bufMeta && ctx && head) {
      const t = Math.max(0, ctx.currentTime - bufMeta.startCtxTime);
      const d = bufMeta.duration;
      cb({
        clipUrl: bufMeta.clipUrl,
        currentTime: Math.min(t, d),
        duration: d,
        playing: t < d && bufferSourceRef.current !== null,
      });
      return;
    }
    const el = audioRef.current;
    if (!el || !head) {
      cb(null);
      return;
    }
    const d = el.duration;
    cb({
      clipUrl: head.url,
      currentTime: el.currentTime,
      duration: Number.isFinite(d) && d > 0 ? d : 0,
      playing: !el.paused && !el.ended,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelPlaybackSyncRaf = useCallback(() => {
    if (playbackRafRef.current) {
      cancelAnimationFrame(playbackRafRef.current);
      playbackRafRef.current = 0;
    }
  }, []);

  const schedulePlaybackSyncRaf = useCallback(() => {
    cancelPlaybackSyncRaf();
    const tick = () => {
      if (!mountedRef.current) return;
      flushPlaybackSync();
      const el = audioRef.current;
      const bufOn = bufferSourceRef.current !== null;
      const elPlaying = el && !el.paused && !el.ended;
      if (bufOn || elPlaying) {
        playbackRafRef.current = requestAnimationFrame(tick);
      }
    };
    playbackRafRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelPlaybackSyncRaf, flushPlaybackSync]);

  const flushPlaybackSyncRef = useRef(flushPlaybackSync);
  const cancelPlaybackSyncRafRef = useRef(cancelPlaybackSyncRaf);
  const schedulePlaybackSyncRafRef = useRef(schedulePlaybackSyncRaf);
  // eslint-disable-next-line react-hooks/refs
  flushPlaybackSyncRef.current = flushPlaybackSync;
  // eslint-disable-next-line react-hooks/refs
  cancelPlaybackSyncRafRef.current = cancelPlaybackSyncRaf;
  // eslint-disable-next-line react-hooks/refs
  schedulePlaybackSyncRafRef.current = schedulePlaybackSyncRaf;

  return {
    onPlaybackSyncRef,
    onActiveClipUrlChangeRef,
    playbackRafRef,
    flushPlaybackSync,
    cancelPlaybackSyncRaf,
    schedulePlaybackSyncRaf,
    flushPlaybackSyncRef,
    cancelPlaybackSyncRafRef,
    schedulePlaybackSyncRafRef,
  };
}

export type AiPlaybackSyncApi = ReturnType<typeof useAiAudioPlaybackSync>;
