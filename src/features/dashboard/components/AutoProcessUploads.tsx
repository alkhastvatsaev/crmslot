"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/core/config/firebase";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

const DESKTOP_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_PROCESS_UPLOADS_INTERVAL_MS) || 15_000;
const MOBILE_INTERVAL_MS = 120_000;

async function postProcessUploads(): Promise<void> {
  const res = await fetchWithAuth("/api/ai/process-uploads", { method: "POST" });
  if (!res.ok && process.env.NODE_ENV === "development") {
    const text = await res.text().catch(() => "");
    logger.warn("[AutoProcessUploads]", { status: res.status, error: text });
  }
}

/**
 * Tant que le dashboard est ouvert : demande au serveur de traiter les nouveaux fichiers
 * dans `public/uploads` (création des `*.audio.json`). Un fichier par requête.
 */
export default function AutoProcessUploads() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile === null || isMobile) return;

    const intervalMs = isMobile ? MOBILE_INTERVAL_MS : DESKTOP_INTERVAL_MS;

    const run = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void postProcessUploads();
    };

    let interval: ReturnType<typeof setInterval> | null = null;
    const boot = setTimeout(run, 1_500);

    const onVisibility = () => {
      if (!document.hidden) run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (auth) {
      const unsub = onAuthStateChanged(auth, () => {
        run();
      });
      interval = setInterval(run, intervalMs);
      return () => {
        clearTimeout(boot);
        if (interval) clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisibility);
        unsub();
      };
    }

    interval = setInterval(run, intervalMs);
    return () => {
      clearTimeout(boot);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isMobile]);

  return null;
}
