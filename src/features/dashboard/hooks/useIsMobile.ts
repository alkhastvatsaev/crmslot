"use client";

import { useEffect, useState } from "react";
import { detectMobileClient } from "@/core/config/mobileClientDetection";

function detectIsMobileClient(): boolean {
  if (typeof window === "undefined") return false;
  return detectMobileClient(navigator.userAgent, window.location.search);
}

/** Retourne null pendant le SSR, puis true/false côté client.
 *  Override dev : ?forceMobile=1 dans l'URL. */
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : detectIsMobileClient()
  );

  useEffect(() => {
    setIsMobile(detectIsMobileClient());
  }, []);

  return isMobile;
}
