"use client";

import { useEffect } from "react";
import { isIphoneUserAgent } from "@/core/config/mobileClientDetection";
import {
  blockServiceWorkerRegistrationOnMobile,
  isMobileServiceWorkerAllowed,
  purgeMobileServiceWorkersAndCaches,
} from "@/core/pwa/mobileServiceWorkerPolicy";

const PURGE_KEY = "crmslot:mobile-sw-purged";

/**
 * iPhone uniquement : purge Workbox/Firebase SW (Android garde la PWA normale).
 */
export default function MobileServiceWorkerDisabler() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !isIphoneUserAgent(navigator.userAgent)) return;
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
