"use client";

import { useEffect } from "react";
import { isPushServiceWorkerEnabled } from "@/features/notifications/fcmWebPush";

/**
 * En dev sans PWA, désenregistre un SW de build prod resté dans le navigateur
 * (évite boucles de reload via cache Workbox sur tunnel ngrok / iPhone).
 */
export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (isPushServiceWorkerEnabled()) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    void (async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    })();
  }, []);

  return null;
}
