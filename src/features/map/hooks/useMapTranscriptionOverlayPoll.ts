"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { TRANSCRIPT_POLL_MS } from "@/features/map/mapTranscriptionReveal";
import type { MapTranscriptionAudiosResponse } from "@/features/map/mapTranscriptionOverlayTypes";

type Options = {
  armed: boolean;
  scopedClipPublicUrl?: string | null;
  onTranscriptReset?: () => void;
  onDecisionRefused?: () => void;
};

export function useMapTranscriptionOverlayPoll({
  armed,
  scopedClipPublicUrl,
  onTranscriptReset,
  onDecisionRefused,
}: Options) {
  const [fullText, setFullText] = useState("");
  const [transcriptSourceUrl, setTranscriptSourceUrl] = useState("");
  const closedForSessionRef = useRef<string | null>(null);
  const currentSessionKeyRef = useRef<string>("");
  const lastTranscriptInSessionRef = useRef<string>("");

  const resetSessionRefs = () => {
    currentSessionKeyRef.current = "";
    lastTranscriptInSessionRef.current = "";
    closedForSessionRef.current = null;
  };

  useEffect(() => {
    if (!armed || scopedClipPublicUrl === undefined) return;
    const s = scopedClipPublicUrl?.trim() ?? "";
    if (s) return;
    resetSessionRefs();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullText("");
    setTranscriptSourceUrl("");
    onTranscriptReset?.();
  }, [armed, scopedClipPublicUrl, onTranscriptReset]);

  useEffect(() => {
    if (!armed) {
      resetSessionRefs();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullText("");
      setTranscriptSourceUrl("");
      onTranscriptReset?.();
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
          onDecisionRefused?.();
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
            onTranscriptReset?.();
          }
          return;
        }

        if (!cancelled) {
          currentSessionKeyRef.current = sessionKey;
          lastTranscriptInSessionRef.current = trimmed;
          setTranscriptSourceUrl(latest.url);
          setFullText(trimmed);
          onTranscriptReset?.();
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
  }, [armed, scopedClipPublicUrl, onTranscriptReset, onDecisionRefused]);

  const clearClosedSession = useCallback(() => {
    closedForSessionRef.current = null;
  }, []);

  const closeSession = useCallback(() => {
    closedForSessionRef.current = currentSessionKeyRef.current || null;
  }, []);

  return {
    fullText,
    transcriptSourceUrl,
    clearClosedSession,
    closeSession,
  };
}
