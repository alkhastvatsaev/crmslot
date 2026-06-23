"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import {
  dismissAndroidInstallPromo,
  isAndroidInstallPromoDismissed,
  isPwaStandalone,
  shouldSuggestAndroidAppInstall,
  type AndroidInstallPromoSurface,
} from "@/core/pwa/androidAppInstallPromo";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function useAndroidAppInstallPromo(surface: AndroidInstallPromoSurface) {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mayPrompt =
      shouldSuggestAndroidAppInstall({
        userAgent: navigator.userAgent,
        isCapacitorNative: isCapacitorNative(),
        isPwaStandalone: isPwaStandalone(),
      }) && !isAndroidInstallPromoDismissed(surface);

    if (!mayPrompt) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [surface]);

  const dismiss = useCallback(() => {
    dismissAndroidInstallPromo(surface);
    setHasNativePrompt(false);
    deferredPromptRef.current = null;
  }, [surface]);

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | null> => {
    const deferred = deferredPromptRef.current;
    if (!deferred) return null;

    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferredPromptRef.current = null;
    setHasNativePrompt(false);
    dismissAndroidInstallPromo(surface);
    return choice.outcome;
  }, [surface]);

  return { hasNativePrompt, install, dismiss };
}
