import { logger } from "@/core/logger";
import {
  LS_UPLOAD_LAST_SEEN,
  isRecoverablePlaybackError,
  resolveClipPublicUrl,
} from "@/features/dispatch/audioUtils";
import {
  playDecodedBuffer,
  stopBufferPlayback,
} from "@/features/dispatch/hooks/aiAudioPlaybackEngineBuffer";
import {
  clipBlobFromBuffer,
  fetchClipArrayBuffer,
  tryPlayMediaElement,
} from "@/features/dispatch/hooks/aiAudioPlaybackEngineFetch";
import { ensureAudioGraph } from "@/features/dispatch/hooks/aiAudioPlaybackEngineGraph";
import type { AiAudioPlaybackEngineDeps } from "@/features/dispatch/hooks/aiAudioPlaybackEngineTypes";

export function createPlayHead(deps: AiAudioPlaybackEngineDeps): () => Promise<void> {
  async function playHead(): Promise<void> {
    const q = deps.queueRef.current;
    if (!q.length || deps.pausedByUserRef.current) {
      deps.sync.cancelPlaybackSyncRafRef.current();
      deps.sync.onPlaybackSyncRef.current?.(null);
      deps.sync.onActiveClipUrlChangeRef.current?.(null);
      deps.setIsPlaying(false);
      deps.setAnalyser(null);
      stopBufferPlayback(deps.bufferSourceRef, deps.bufferMetaRef);
      return;
    }

    const session = ++deps.playSessionRef.current;
    const clip = q[0];
    deps.sync.onActiveClipUrlChangeRef.current?.(clip.url);

    const isStale = () => session !== deps.playSessionRef.current;

    const finishClip = () => {
      if (session !== deps.playSessionRef.current) return;
      deps.setQueue((prev) => {
        const [done, ...rest] = prev;
        if (done) {
          localStorage.setItem(LS_UPLOAD_LAST_SEEN, done.createdAt);
          if (done.firestoreUpdatedAt) {
            localStorage.setItem("ai_last_listened_updated_at", done.firestoreUpdatedAt);
          }
        }
        deps.queueRef.current = rest;
        return rest;
      });
      deps.setAnalyser(null);
      stopBufferPlayback(deps.bufferSourceRef, deps.bufferMetaRef);
      if (!deps.pausedByUserRef.current) {
        requestAnimationFrame(() => {
          void playHead();
        });
      } else {
        deps.setIsPlaying(false);
      }
    };

    try {
      let effectiveUrl = clip.url;
      if (typeof window !== "undefined") {
        effectiveUrl = await resolveClipPublicUrl(clip.url);
        if (isStale() || !deps.mountedRef.current) return;
        if (effectiveUrl !== clip.url) {
          deps.setQueue((prev) => {
            const [h, ...t] = prev;
            if (!h || h.url !== clip.url) return prev;
            const next = [{ ...h, url: effectiveUrl }, ...t];
            deps.queueRef.current = next;
            return next;
          });
        }
      }

      const node = await ensureAudioGraph(deps.audioContextRef, deps.audioRef, deps.sync);
      if (isStale() || !deps.mountedRef.current) return;
      if (!node) {
        deps.setIsPlaying(false);
        deps.setAnalyser(null);
        return;
      }
      deps.setAnalyser(node);

      const el = deps.audioRef.current;
      if (!el) return;

      stopBufferPlayback(deps.bufferSourceRef, deps.bufferMetaRef);

      el.onended = () => {
        if (session !== deps.playSessionRef.current) return;
        finishClip();
      };

      el.pause();
      const absResolved =
        typeof window !== "undefined"
          ? new URL(effectiveUrl, window.location.origin).href
          : effectiveUrl;

      if (el.src !== absResolved) {
        if (deps.objectUrlRef.current) {
          URL.revokeObjectURL(deps.objectUrlRef.current);
          deps.objectUrlRef.current = null;
        }
        el.src = absResolved;
        el.load();
      } else if (el.ended) {
        el.currentTime = 0;
      }

      let fetched: ArrayBuffer | null = null;
      const ensureFetched = async () => {
        if (fetched) return fetched;
        fetched = await fetchClipArrayBuffer(absResolved, clip);
        return fetched;
      };

      let played = await tryPlayMediaElement(el);
      if (!played) {
        const ab = await ensureFetched();
        const blob = clipBlobFromBuffer(ab, effectiveUrl);
        if (deps.objectUrlRef.current) URL.revokeObjectURL(deps.objectUrlRef.current);
        try {
          deps.objectUrlRef.current = URL.createObjectURL(blob);
          el.src = deps.objectUrlRef.current;
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
        await playDecodedBuffer({
          ab,
          syncClipUrl: effectiveUrl,
          session,
          playSessionRef: deps.playSessionRef,
          audioContextRef: deps.audioContextRef,
          bufferSourceRef: deps.bufferSourceRef,
          bufferMetaRef: deps.bufferMetaRef,
          setAnalyser: deps.setAnalyser,
          sync: deps.sync,
          onEnded: finishClip,
        });
        if (isStale() || !deps.mountedRef.current) return;
        deps.setIsPlaying(true);
        return;
      }

      if (isStale() || !deps.mountedRef.current) return;
      deps.setIsPlaying(true);
    } catch (e) {
      if (isStale() || !deps.mountedRef.current) return;
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      if (isRecoverablePlaybackError(e)) {
        deps.setIsPlaying(false);
        deps.setAnalyser(null);
        stopBufferPlayback(deps.bufferSourceRef, deps.bufferMetaRef);
        return;
      }
      logger.error("lecture audio:", { error: e instanceof Error ? e.message : String(e) });
      deps.setIsPlaying(false);
      deps.setAnalyser(null);
      stopBufferPlayback(deps.bufferSourceRef, deps.bufferMetaRef);

      finishClip();
    }
  }

  return playHead;
}
