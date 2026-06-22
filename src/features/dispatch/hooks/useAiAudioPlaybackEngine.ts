"use client";

import { useCallback, useEffect, useRef } from "react";
import { logger } from "@/core/logger";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { AiPlaybackSyncApi } from "@/features/dispatch/hooks/useAiAudioPlaybackSync";
import {
  LS_UPLOAD_LAST_SEEN,
  type QueuedClip,
  isRecoverablePlaybackError,
  mimeFromAudioUrl,
  resolveClipPublicUrl,
  uploadPathCandidatesFromUrl,
  waitForCanPlay,
} from "@/features/dispatch/audioUtils";

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
  bufferMetaRef: React.MutableRefObject<{
    startCtxTime: number;
    duration: number;
    clipUrl: string;
  } | null>,
  sync: AiPlaybackSyncApi,
  onUserPressPlay?: () => void
) {
  const playSessionRef = useRef(0);

  const stopBufferPlayback = useCallback(() => {
    if (bufferSourceRef.current) {
      try {
        bufferSourceRef.current.stop(0);
      } catch {
        /* déjà stoppé */
      }
      bufferSourceRef.current = null;
    }
    bufferMetaRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureAudioGraph = useCallback(async (): Promise<AnalyserNode | null> => {
    if (!audioContextRef.current) {
      const MaybeWebkit = (window as unknown as { webkitAudioContext?: unknown })
        .webkitAudioContext;
      const Ctx =
        window.AudioContext ??
        (typeof MaybeWebkit === "function" ? (MaybeWebkit as typeof AudioContext) : undefined);
      if (!Ctx) {
        logger.error("AudioContext indisponible dans ce navigateur");
        return null;
      }
      audioContextRef.current = new Ctx();
    }
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (err) {
        if (isRecoverablePlaybackError(err)) return null;
        throw err;
      }
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      const elHook = audioRef.current;
      elHook.setAttribute("playsinline", "");
      elHook.setAttribute("webkit-playsinline", "");
      elHook.preload = "auto";
      elHook.crossOrigin = "anonymous";
      elHook.addEventListener("loadedmetadata", () => sync.flushPlaybackSyncRef.current());
      elHook.addEventListener("play", () => sync.schedulePlaybackSyncRafRef.current());
      elHook.addEventListener("pause", () => {
        sync.cancelPlaybackSyncRafRef.current();
        sync.flushPlaybackSyncRef.current();
      });
      elHook.addEventListener("ended", () => {
        sync.cancelPlaybackSyncRafRef.current();
        sync.flushPlaybackSyncRef.current();
      });
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      const analyserNode = audioContextRef.current.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      analyserNode.connect(audioContextRef.current.destination);
      (audioRef.current as unknown as { __analyser: AnalyserNode }).__analyser = analyserNode;
    }
    return (audioRef.current as unknown as { __analyser: AnalyserNode }).__analyser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync]);

  const playHead = useCallback(async () => {
    const q = queueRef.current;
    if (!q.length || pausedByUserRef.current) {
      sync.cancelPlaybackSyncRafRef.current();
      sync.onPlaybackSyncRef.current?.(null);
      sync.onActiveClipUrlChangeRef.current?.(null);
      setIsPlaying(false);
      setAnalyser(null);
      stopBufferPlayback();
      return;
    }

    const session = ++playSessionRef.current;
    const clip = q[0];
    sync.onActiveClipUrlChangeRef.current?.(clip.url);

    const isStale = () => session !== playSessionRef.current;

    const finishClip = () => {
      if (session !== playSessionRef.current) return;
      setQueue((prev) => {
        const [done, ...rest] = prev;
        if (done) {
          localStorage.setItem(LS_UPLOAD_LAST_SEEN, done.createdAt);
          if (done.firestoreUpdatedAt) {
            localStorage.setItem("ai_last_listened_updated_at", done.firestoreUpdatedAt);
          }
        }
        queueRef.current = rest;
        return rest;
      });
      setAnalyser(null);
      stopBufferPlayback();
      if (!pausedByUserRef.current) {
        requestAnimationFrame(() => {
          // eslint-disable-next-line react-hooks/immutability
          void playHead();
        });
      } else {
        setIsPlaying(false);
      }
    };

    const tryPlayMediaElement = async (mediaEl: HTMLAudioElement): Promise<boolean> => {
      await waitForCanPlay(mediaEl, 900);
      try {
        await mediaEl.play();
        return true;
      } catch (err) {
        if (isRecoverablePlaybackError(err)) return false;
        throw err;
      }
    };

    const playDecodedBuffer = async (ab: ArrayBuffer, syncClipUrl: string) => {
      const ctx = audioContextRef.current;
      if (!ctx) throw new Error("AudioContext indisponible");
      await ctx.resume();
      stopBufferPlayback();
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await ctx.decodeAudioData(ab.slice(0));
      } catch (e) {
        logger.error("decodeAudioData:", { error: e instanceof Error ? e.message : String(e) });
        throw e;
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      source.connect(analyserNode);
      analyserNode.connect(ctx.destination);
      setAnalyser(analyserNode);
      bufferSourceRef.current = source;
      bufferMetaRef.current = {
        startCtxTime: ctx.currentTime,
        duration: audioBuffer.duration,
        clipUrl: syncClipUrl,
      };
      source.onended = () => {
        if (session !== playSessionRef.current) return;
        sync.cancelPlaybackSyncRafRef.current();
        sync.flushPlaybackSyncRef.current();
        finishClip();
      };
      source.start(0);
      sync.schedulePlaybackSyncRafRef.current();
    };

    try {
      let effectiveUrl = clip.url;
      if (typeof window !== "undefined") {
        effectiveUrl = await resolveClipPublicUrl(clip.url);
        if (isStale() || !mountedRef.current) return;
        if (effectiveUrl !== clip.url) {
          setQueue((prev) => {
            const [h, ...t] = prev;
            if (!h || h.url !== clip.url) return prev;
            const next = [{ ...h, url: effectiveUrl }, ...t];
            queueRef.current = next;
            return next;
          });
        }
      }

      const node = await ensureAudioGraph();
      if (isStale() || !mountedRef.current) return;
      if (!node) {
        setIsPlaying(false);
        setAnalyser(null);
        return;
      }
      setAnalyser(node);

      const el = audioRef.current;
      if (!el) return;

      stopBufferPlayback();

      el.onended = () => {
        if (session !== playSessionRef.current) return;
        finishClip();
      };

      el.pause();
      const absResolved =
        typeof window !== "undefined"
          ? new URL(effectiveUrl, window.location.origin).href
          : effectiveUrl;

      if (el.src !== absResolved) {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        el.src = absResolved;
        el.load();
      } else if (el.ended) {
        el.currentTime = 0;
      }

      let fetched: ArrayBuffer | null = null;
      const ensureFetched = async () => {
        if (fetched) return fetched;
        const tryDownload = async (href: string) => {
          const res = await fetch(href, { cache: "no-store" });
          if (!res.ok) return null;
          return res.arrayBuffer();
        };

        let ab = await tryDownload(absResolved);
        if (!ab && typeof window !== "undefined") {
          for (const name of uploadPathCandidatesFromUrl(clip.url, window.location.origin)) {
            const res = await fetchWithAuth(
              `/api/ai/resolve-audio-url?name=${encodeURIComponent(name)}`,
              { cache: "no-store" }
            );
            if (!res.ok) continue;
            const j = (await res.json()) as { url?: string };
            if (!j?.url) continue;
            const nextAbs = new URL(j.url, window.location.origin).href;
            ab = await tryDownload(nextAbs);
            if (ab) break;
          }
        }
        if (!ab) throw new Error(`Téléchargement audio: 404`);
        fetched = ab;
        return fetched;
      };

      let played = await tryPlayMediaElement(el);
      if (!played) {
        const ab = await ensureFetched();
        const mime = mimeFromAudioUrl(effectiveUrl);
        const blob = new Blob([ab], { type: mime });
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        try {
          objectUrlRef.current = URL.createObjectURL(blob);
          el.src = objectUrlRef.current;
        } catch (e) {
          logger.error("AiAssistant createObjectURL failed", {
            error: e instanceof Error ? e.message : String(e),
          });
        }
        el.load();
        played = await tryPlayMediaElement(el);
      }

      if (!played) {
        const ab = await ensureFetched();
        el.pause();
        await playDecodedBuffer(ab, effectiveUrl);
        if (isStale() || !mountedRef.current) return;
        setIsPlaying(true);
        return;
      }

      if (isStale() || !mountedRef.current) return;
      setIsPlaying(true);
    } catch (e) {
      if (isStale() || !mountedRef.current) return;
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      if (isRecoverablePlaybackError(e)) {
        setIsPlaying(false);
        setAnalyser(null);
        stopBufferPlayback();
        return;
      }
      logger.error("lecture audio:", { error: e instanceof Error ? e.message : String(e) });
      setIsPlaying(false);
      setAnalyser(null);
      stopBufferPlayback();

      finishClip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureAudioGraph, setAnalyser, setIsPlaying, setQueue, stopBufferPlayback, sync]);

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
    stopBufferPlayback();
    audioRef.current?.pause();
    setIsPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsPlaying, stopBufferPlayback, sync]);

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
