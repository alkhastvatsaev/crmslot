"use client";

import { useEffect, useRef } from "react";
import {
  useAndroidAppInstallPromo,
  type BeforeInstallPromptEvent,
} from "@/core/pwa/useAndroidAppInstallPromo";
import type { AndroidInstallPromoSurface } from "@/core/pwa/androidAppInstallPromo";

type Props = {
  surface: AndroidInstallPromoSurface;
};

/**
 * Déclenche uniquement le dialogue d’installation natif Chrome (`beforeinstallprompt` → `prompt()`).
 * Aucune bannière / modale applicative — si Chrome ne propose pas l’install, on n’affiche rien.
 */
export default function AndroidAppInstallPromoBootstrap({ surface }: Props) {
  const { hasNativePrompt, install, dismiss } = useAndroidAppInstallPromo(surface);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!hasNativePrompt || promptedRef.current) return;

    const timer = window.setTimeout(() => {
      promptedRef.current = true;
      void install().then((outcome) => {
        if (outcome === "dismissed") dismiss();
      });
    }, 2_000);

    return () => window.clearTimeout(timer);
  }, [dismiss, hasNativePrompt, install]);

  return null;
}

export type { BeforeInstallPromptEvent };
