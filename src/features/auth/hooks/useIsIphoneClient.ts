"use client";

import { useEffect, useState } from "react";
import { isAppleOAuthClient } from "@/core/config/mobileClientDetection";

function detectAppleOAuthClient(): boolean {
  if (typeof window === "undefined") return false;
  return isAppleOAuthClient({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

/** null pendant le SSR, puis true sur iPhone/iPod ou Mac bureau. */
export function useIsAppleOAuthClient(): boolean | null {
  const [showApple, setShowApple] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : detectAppleOAuthClient()
  );

  useEffect(() => {
    setShowApple(detectAppleOAuthClient());
  }, []);

  return showApple;
}

/** @deprecated Utiliser `useIsAppleOAuthClient`. */
export const useIsIphoneClient = useIsAppleOAuthClient;
