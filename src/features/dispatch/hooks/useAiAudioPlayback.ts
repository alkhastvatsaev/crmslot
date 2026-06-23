"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import type {
  UseAiAudioPlaybackOptions,
  UseAiAudioPlaybackReturn,
} from "@/features/dispatch/aiAudioPlaybackTypes";
import { LS_UPLOAD_LAST_SEEN, type QueuedClip } from "@/features/dispatch/audioUtils";
import { useAiAudioDiskPoll } from "@/features/dispatch/hooks/useAiAudioDiskPoll";
import { useAiAudioFirestoreQueue } from "@/features/dispatch/hooks/useAiAudioFirestoreQueue";
import { useAiAudioPlaybackEngine } from "@/features/dispatch/hooks/useAiAudioPlaybackEngine";
import { useAiAudioPlaybackSync } from "@/features/dispatch/hooks/useAiAudioPlaybackSync";

export type {
  AiPlaybackSync,
  UseAiAudioPlaybackOptions,
  UseAiAudioPlaybackReturn,
} from "@/features/dispatch/aiAudioPlaybackTypes";

export function useAiAudioPlayback({
  onUserPressPlay,
  onPlaybackSync,
  onActiveClipUrlChange,
  onQueueChange,
  onNewFirestoreClip,
  backgroundTasksEnabled = true,
}: UseAiAudioPlaybackOptions = {}): UseAiAudioPlaybackReturn {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [queue, setQueue] = useState<QueuedClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [authed, setAuthed] = useState(false);

  const queueRef = useRef<QueuedClip[]>([]);
  const pausedByUserRef = useRef(false);
  const diskInitRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const isPlayingRef = useRef(false);
  const mountedRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferMetaRef = useRef<{
    startCtxTime: number;
    duration: number;
    clipUrl: string;
  } | null>(null);

  const sync = useAiAudioPlaybackSync(
    queueRef,
    audioContextRef,
    audioRef,
    bufferSourceRef,
    bufferMetaRef,
    mountedRef,
    onPlaybackSync,
    onActiveClipUrlChange
  );

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setAuthed(!!u));
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window !== "undefined") {
      if (!localStorage.getItem(LS_UPLOAD_LAST_SEEN)) {
        localStorage.setItem(LS_UPLOAD_LAST_SEEN, new Date().toISOString());
      }
      if (!localStorage.getItem("ai_last_listened_updated_at")) {
        localStorage.setItem("ai_last_listened_updated_at", "initial-demo-marker");
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    queueRef.current = queue;
    onQueueChange?.(queue);
  }, [queue, onQueueChange]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const { playHead, startPlayback, stopPlayback } = useAiAudioPlaybackEngine(
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
    sync,
    onUserPressPlay
  );

  useAiAudioFirestoreQueue(
    backgroundTasksEnabled,
    authed,
    setQueue,
    queueRef,
    pausedByUserRef,
    isPlayingRef,
    pendingPlayRef,
    onNewFirestoreClip
  );

  useAiAudioDiskPoll(
    backgroundTasksEnabled,
    setQueue,
    queueRef,
    pausedByUserRef,
    isPlayingRef,
    pendingPlayRef,
    diskInitRef
  );

  useEffect(() => {
    if (!diskInitRef.current) return;
    if (pendingPlayRef.current && queue.length && !isPlaying && !pausedByUserRef.current) {
      pendingPlayRef.current = false;
      void playHead();
    }
  }, [isPlaying, playHead, queue]);

  return { analyser, queue, isPlaying, startPlayback, stopPlayback };
}
