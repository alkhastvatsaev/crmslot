"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore as db } from "@/core/config/firebase";
import {
  queueFindIndexByBasename,
  serializeFirestoreUpdatedAt,
  type QueuedClip,
} from "@/features/dispatch/audioUtils";

export function useAiAudioFirestoreQueue(
  backgroundTasksEnabled: boolean,
  authed: boolean,
  setQueue: React.Dispatch<React.SetStateAction<QueuedClip[]>>,
  queueRef: React.MutableRefObject<QueuedClip[]>,
  pausedByUserRef: React.MutableRefObject<boolean>,
  isPlayingRef: React.MutableRefObject<boolean>,
  pendingPlayRef: React.MutableRefObject<boolean>,
  onNewFirestoreClip?: () => void
) {
  const isFirstFirestoreSnapshot = useRef(true);

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
      onNewFirestoreClip?.();
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, backgroundTasksEnabled, setQueue]);
}
