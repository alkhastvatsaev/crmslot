"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore as db } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  LS_UPLOAD_LAST_SEEN,
  type QueuedClip,
  isRecoverablePlaybackError,
  isPollableDiskAudioName,
  mimeFromAudioUrl,
  queueFindIndexByBasename,
  resolveClipPublicUrl,
  serializeFirestoreUpdatedAt,
  uploadPathCandidatesFromUrl,
  waitForCanPlay,
} from "@/features/dispatch/audioUtils";
import { isMobilePowerSaveClient } from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

export type AiPlaybackSync = {
  clipUrl: string;
  currentTime: number;
  duration: number;
  playing: boolean;
} | null;

type AudiosPayload = {
  audios: Array<{ name: string; url: string; createdAt: string; transcript: string | null }>;
};

export type UseAiAudioPlaybackOptions = {
  onUserPressPlay?: () => void;
  onPlaybackSync?: (sync: AiPlaybackSync) => void;
  onActiveClipUrlChange?: (clipPublicUrl: string | null) => void;
  onQueueChange?: (queue: QueuedClip[]) => void;
  /** Firestore + polling disque — désactiver hors page carte mobile. */
  backgroundTasksEnabled?: boolean;
};

export type UseAiAudioPlaybackReturn = {
  analyser: AnalyserNode | null;
  queue: QueuedClip[];
  isPlaying: boolean;
  startPlayback: () => void;
  stopPlayback: () => void;
};

export function useAiAudioPlayback({
  onUserPressPlay,
  onPlaybackSync,
  onActiveClipUrlChange,
  onQueueChange,
  backgroundTasksEnabled = true,
}: UseAiAudioPlaybackOptions = {}): UseAiAudioPlaybackReturn {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [queue, setQueue] = useState<QueuedClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setAuthed(!!u));
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferMetaRef = useRef<{
    startCtxTime: number;
    duration: number;
    clipUrl: string;
  } | null>(null);
  const queueRef = useRef<QueuedClip[]>([]);
  const pausedByUserRef = useRef(false);
  const diskInitRef = useRef(false);
  const isFirstFirestoreSnapshot = useRef(true);
  const pendingPlayRef = useRef(false);
  const isPlayingRef = useRef(false);

  const playSessionRef = useRef(0);
  const mountedRef = useRef(true);
  const onPlaybackSyncRef = useRef<UseAiAudioPlaybackOptions["onPlaybackSync"]>(undefined);
  const onActiveClipUrlChangeRef =
    useRef<UseAiAudioPlaybackOptions["onActiveClipUrlChange"]>(undefined);
  const playbackRafRef = useRef(0);

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
  }, [flushPlaybackSync, cancelPlaybackSyncRaf]);

  const flushPlaybackSyncRef = useRef(flushPlaybackSync);
  const cancelPlaybackSyncRafRef = useRef(cancelPlaybackSyncRaf);
  const schedulePlaybackSyncRafRef = useRef(schedulePlaybackSyncRaf);
  // eslint-disable-next-line react-hooks/refs
  flushPlaybackSyncRef.current = flushPlaybackSync;
  // eslint-disable-next-line react-hooks/refs
  cancelPlaybackSyncRafRef.current = cancelPlaybackSyncRaf;
  // eslint-disable-next-line react-hooks/refs
  schedulePlaybackSyncRafRef.current = schedulePlaybackSyncRaf;

  useEffect(() => {
    onPlaybackSyncRef.current = onPlaybackSync;
  }, [onPlaybackSync]);

  useEffect(() => {
    onActiveClipUrlChangeRef.current = onActiveClipUrlChange;
  }, [onActiveClipUrlChange]);

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
      elHook.addEventListener("loadedmetadata", () => flushPlaybackSyncRef.current());
      elHook.addEventListener("play", () => schedulePlaybackSyncRafRef.current());
      elHook.addEventListener("pause", () => {
        cancelPlaybackSyncRafRef.current();
        flushPlaybackSyncRef.current();
      });
      elHook.addEventListener("ended", () => {
        cancelPlaybackSyncRafRef.current();
        flushPlaybackSyncRef.current();
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
  }, []);

  const playHead = useCallback(async () => {
    const q = queueRef.current;
    if (!q.length || pausedByUserRef.current) {
      cancelPlaybackSyncRafRef.current();
      onPlaybackSyncRef.current?.(null);
      onActiveClipUrlChangeRef.current?.(null);
      setIsPlaying(false);
      setAnalyser(null);
      stopBufferPlayback();
      return;
    }

    const session = ++playSessionRef.current;
    const clip = q[0];
    onActiveClipUrlChangeRef.current?.(clip.url);

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
        cancelPlaybackSyncRafRef.current();
        flushPlaybackSyncRef.current();
        finishClip();
      };
      source.start(0);
      schedulePlaybackSyncRafRef.current();
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
  }, [ensureAudioGraph, stopBufferPlayback]);

  const startPlayback = useCallback(() => {
    pausedByUserRef.current = false;
    pendingPlayRef.current = false;
    const head = queueRef.current[0];
    onActiveClipUrlChangeRef.current?.(head?.url ?? null);
    onUserPressPlay?.();
    if (!queueRef.current.length) return;
    void playHead();
  }, [onUserPressPlay, playHead]);

  const stopPlayback = useCallback(() => {
    pausedByUserRef.current = true;
    playSessionRef.current += 1;
    cancelPlaybackSyncRaf();
    stopBufferPlayback();
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [cancelPlaybackSyncRaf, stopBufferPlayback]);

  // Firestore listener
  useEffect(() => {
    if (!backgroundTasksEnabled || !db || !authed) return;

    const unsub = onSnapshot(doc(db, "ai_status", "macrodroid"), (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (!data?.audioUrl || data.updatedAt == null) return;

      const id = serializeFirestoreUpdatedAt(data.updatedAt);

      if (isFirstFirestoreSnapshot.current) {
        isFirstFirestoreSnapshot.current = false;
        localStorage.setItem("ai_last_listened_updated_at", id);
        return;
      }

      const last = localStorage.getItem("ai_last_listened_updated_at");
      if (id === last) return;

      localStorage.setItem("ai_last_listened_updated_at", id);

      const url = String(data.audioUrl);
      setQueue((prev) => {
        if (prev.some((c) => c.url === url)) return prev;
        const dupIdx = queueFindIndexByBasename(prev, url);
        if (dupIdx >= 0) {
          const next = [...prev];
          next[dupIdx] = {
            ...next[dupIdx],
            url,
            source: "firestore",
            firestoreUpdatedAt: id,
          };
          queueRef.current = next;
          return next;
        }
        const next = [
          ...prev,
          {
            url,
            createdAt: new Date().toISOString(),
            source: "firestore" as const,
            firestoreUpdatedAt: id,
          },
        ];
        queueRef.current = next;
        return next;
      });
      if (!pausedByUserRef.current && !isPlayingRef.current) {
        pendingPlayRef.current = true;
      }
    });

    return () => unsub();
  }, [backgroundTasksEnabled, authed]);

  // Disk polling
  useEffect(() => {
    if (!backgroundTasksEnabled) return;

    let cancelled = false;

    const poll = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!auth?.currentUser) return;
      try {
        const res = await fetchWithAuth("/api/ai/audios");
        if (!res.ok || cancelled) return;
        const { audios } = (await res.json()) as AudiosPayload;
        const clips = audios
          .filter((a) => isPollableDiskAudioName(a.name))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (!diskInitRef.current) {
          diskInitRef.current = true;
          if (clips.length) {
            localStorage.setItem(LS_UPLOAD_LAST_SEEN, clips[clips.length - 1].createdAt);
          } else {
            localStorage.setItem(LS_UPLOAD_LAST_SEEN, new Date().toISOString());
          }
          return;
        }

        const lastSeen = localStorage.getItem(LS_UPLOAD_LAST_SEEN);
        if (!lastSeen) return;

        const t = new Date(lastSeen).getTime();
        const fresh = clips.filter((a) => new Date(a.createdAt).getTime() > t);

        if (fresh.length) {
          setQueue((prev) => {
            let next = prev;
            for (const a of fresh) {
              if (next.some((c) => c.url === a.url)) continue;
              const dupIdx = queueFindIndexByBasename(next, a.url);
              if (dupIdx >= 0) {
                const existing = next[dupIdx];
                const pathDepth = (u: string) =>
                  new URL(u, "http://localhost").pathname.split("/").filter(Boolean).length;
                const incomingD = pathDepth(a.url);
                const existingD = pathDepth(existing.url);
                const preferIncoming =
                  incomingD > existingD ||
                  (incomingD === existingD &&
                    new Date(a.createdAt).getTime() > new Date(existing.createdAt).getTime());
                next = [...next];
                next[dupIdx] = {
                  ...existing,
                  url: preferIncoming ? a.url : existing.url,
                  createdAt: preferIncoming ? a.createdAt : existing.createdAt,
                  source: "disk",
                };
                continue;
              }
              next = [...next, { url: a.url, createdAt: a.createdAt, source: "disk" as const }];
            }
            queueRef.current = next;
            return next;
          });
          if (!pausedByUserRef.current && !isPlayingRef.current) {
            pendingPlayRef.current = true;
          }
        }
      } catch {
        /* ignore */
      }
    };

    const pollIntervalMs = isMobilePowerSaveClient() ? 30_000 : 5_000;
    const iv = setInterval(poll, pollIntervalMs);
    poll();
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [backgroundTasksEnabled]);

  // Auto-play when queue grows
  useEffect(() => {
    if (!diskInitRef.current) return;
    if (pendingPlayRef.current && queue.length && !isPlaying && !pausedByUserRef.current) {
      pendingPlayRef.current = false;
      void playHead();
    }
  }, [queue, isPlaying, playHead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPlaybackSyncRafRef.current();
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
  }, []);

  return { analyser, queue, isPlaying, startPlayback, stopPlayback };
}
