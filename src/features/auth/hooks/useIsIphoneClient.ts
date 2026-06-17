"use client";

import { useEffect, useState } from "react";
import { isIphoneUserAgent } from "@/core/config/mobileClientDetection";

function detectIphoneClient(): boolean {
  if (typeof window === "undefined") return false;
  return isIphoneUserAgent(navigator.userAgent);
}

/** null pendant le SSR, puis true sur iPhone/iPod uniquement. */
export function useIsIphoneClient(): boolean | null {
  const [isIphone, setIsIphone] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : detectIphoneClient()
  );

  useEffect(() => {
    setIsIphone(detectIphoneClient());
  }, []);

  return isIphone;
}
