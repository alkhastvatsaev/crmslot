"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { MapTranscriptionLatestAudioResponse } from "@/features/map/mapTranscriptionActionsTypes";

type UseMapTranscriptionActionsPollOptions = {
  armed: boolean;
  scopedClipPublicUrl?: string | null;
};

export function useMapTranscriptionActionsPoll({
  armed,
  scopedClipPublicUrl,
}: UseMapTranscriptionActionsPollOptions) {
  const [latest, setLatest] = useState<MapTranscriptionLatestAudioResponse | null>(null);

  useEffect(() => {
    const s = scopedClipPublicUrl?.trim() ?? "";
    if (s) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLatest(null);
  }, [armed, scopedClipPublicUrl]);

  useEffect(() => {
    if (!armed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLatest(null);
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
        const data = (await res.json()) as MapTranscriptionLatestAudioResponse;
        if (!cancelled) setLatest(data);
      } catch {
        /* ignore */
      }
    };

    void tick();
    const pollMs =
      Number(process.env.NEXT_PUBLIC_TRANSCRIPT_POLL_MS) > 0
        ? Number(process.env.NEXT_PUBLIC_TRANSCRIPT_POLL_MS)
        : 3000;
    const id = setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [armed, scopedClipPublicUrl]);

  return { latest, setLatest };
}
