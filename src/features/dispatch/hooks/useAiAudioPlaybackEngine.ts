"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AiPlaybackSyncApi } from "@/features/dispatch/hooks/useAiAudioPlaybackSync";
import { stopBufferPlayback } from "@/features/dispatch/hooks/aiAudioPlaybackEngineBuffer";
import { createPlayHead } from "@/features/dispatch/hooks/aiAudioPlaybackEnginePlayHead";
import type {
  AiAudioBufferMeta,
  AiAudioPlaybackEngineDeps,
} from "@/features/dispatch/hooks/aiAudioPlaybackEngineTypes";
import type { QueuedClip } from "@/features/dispatch/audioUtils";

export function useAiAudioPlaybackEngine(
  setQueue: React.Dispatch<React.SetStateAction<QueuedClip[]>>,
  setAnalyser: React.Dispatch<React.SetStateAction<AnalyserNode | null>>,
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>,
  queueRef: React.MutableRefObject<QueuedClip[]>,
  pausedByUserRef: React.MutableRefObject<boolean>,
  pendingPlayRef: React.MutableRefObject<boolean>,
  mountedRef: React.MutableRefObject<boolean>,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  objectUrlRef: React.MutableRefObject<string | null>,
  bufferSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
  bufferMetaRef: React.MutableRefObject<AiAudioBufferMeta | null>,
  sync: AiPlaybackSyncApi,
  onUserPressPlay?: () => void
) {
  const playSessionRef = useRef(0);

  const engineDeps: AiAudioPlaybackEngineDeps = {
    setQueue,
    setAnalyser,
    setIsPlaying,
    queueRef,
    pausedByUserRef,
    pendingPlayRef,
    mountedRef,
    audioContextRef,
    audioRef,
    objectUrlRef,
    bufferSourceRef,
    bufferMetaRef,
    playSessionRef,
    sync,
  };

  const playHeadRef = useRef<() => Promise<void>>(() => Promise.resolve());
  playHeadRef.current = createPlayHead(engineDeps);

  const playHead = useCallback(async () => {
    await playHeadRef.current();
  }, [setAnalyser, setIsPlaying, setQueue, sync]);

  const startPlayback = useCallback(() => {
    pausedByUserRef.current = false;
    pendingPlayRef.current = false;
    const head = queueRef.current[0];
    sync.onActiveClipUrlChangeRef.current?.(head?.url ?? null);
    onUserPressPlay?.();
    if (!queueRef.current.length) return;
    void playHead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUserPressPlay, playHead, sync]);

  const stopPlayback = useCallback(() => {
    pausedByUserRef.current = true;
    playSessionRef.current += 1;
    sync.cancelPlaybackSyncRaf();
    stopBufferPlayback(bufferSourceRef, bufferMetaRef);
    audioRef.current?.pause();
    setIsPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsPlaying, sync]);

  useEffect(() => {
    return () => {
      sync.cancelPlaybackSyncRafRef.current();
      if (bufferSourceRef.current) {
        try {
          bufferSourceRef.current.stop(0);
        } catch {
          /* noop */
        }
        bufferSourceRef.current = null;
      }
      bufferMetaRef.current = null;
      audioRef.current?.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      audioRef.current = null;
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync]);

  return { playHead, startPlayback, stopPlayback };
}
