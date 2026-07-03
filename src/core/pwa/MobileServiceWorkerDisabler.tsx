"use client";

import { useEffect } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { purgeMobileServiceWorkersAndCaches } from "@/core/pwa/mobileServiceWorkerPolicy";

/** Capacitor : désactive le service worker PWA (sinon push Chrome / data-only). */
export default function MobileServiceWorkerDisabler() {
  useEffect(() => {
    if (!isCapacitorNative()) return;
    void purgeMobileServiceWorkersAndCaches().catch(() => null);
  }, []);

  return null;
}
