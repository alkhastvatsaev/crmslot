"use client";

import { useEffect } from "react";
import { isPhoneUserAgent } from "@/core/config/mobileClientDetection";
import {
  blockServiceWorkerRegistrationOnMobile,
  isMobileServiceWorkerAllowed,
  purgeMobileServiceWorkersAndCaches,
} from "@/core/pwa/mobileServiceWorkerPolicy";

const PURGE_KEY = "crmslot:mobile-sw-purged";

/**
 * iPhone/Android phone : désinstalle Workbox + Firebase SW et bloque le ré-enregistrement.
 * Cause majeure de chauffe PWA (processus SW séparé + cache continu).
 */
export default function MobileServiceWorkerDisabler() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !isPhoneUserAgent(navigator.userAgent)) return;
    if (isMobileServiceWorkerAllowed()) return;

    blockServiceWorkerRegistrationOnMobile();

    try {
      if (window.sessionStorage.getItem(PURGE_KEY) === "1") return;
      window.sessionStorage.setItem(PURGE_KEY, "1");
    } catch {
      /* private mode */
    }

    void purgeMobileServiceWorkersAndCaches();
  }, []);

  return null;
}
