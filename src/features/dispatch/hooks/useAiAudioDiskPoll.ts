"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/core/config/firebase";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  LS_UPLOAD_LAST_SEEN,
  isPollableDiskAudioName,
  queueFindIndexByBasename,
  type QueuedClip,
} from "@/features/dispatch/audioUtils";

type AudiosPayload = {
  audios: Array<{ name: string; url: string; createdAt: string; transcript: string | null }>;
};

export function useAiAudioDiskPoll(
  backgroundTasksEnabled: boolean,
  setQueue: React.Dispatch<React.SetStateAction<QueuedClip[]>>,
  queueRef: React.MutableRefObject<QueuedClip[]>,
  pausedByUserRef: React.MutableRefObject<boolean>,
  isPlayingRef: React.MutableRefObject<boolean>,
  pendingPlayRef: React.MutableRefObject<boolean>,
  diskInitRef: React.MutableRefObject<boolean>
) {
  const [, setPollActive] = useState(false);

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

    const pollIntervalMs = 5_000;
    setPollActive(true);
    const iv = setInterval(poll, pollIntervalMs);
    poll();
    return () => {
      cancelled = true;
      setPollActive(false);
      clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundTasksEnabled, setQueue]);
}
