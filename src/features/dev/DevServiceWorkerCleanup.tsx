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

    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        void reg.unregister();
      });
    });
  }, []);

  return null;
}
