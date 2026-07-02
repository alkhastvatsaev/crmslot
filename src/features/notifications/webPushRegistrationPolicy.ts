import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import { isPushServiceWorkerEnabled } from "@/features/notifications/fcmWebPush";

/**
 * Web Push FCM utilisable sur ce device ?
 * - PWA écran d’accueil (iOS obligatoire, Android recommandé)
 * - Capacitor : jetons natifs uniquement (iOS + Android) — pas de secours WebView
 */
export function isWebPushRegistrationAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (!isPushServiceWorkerEnabled()) return false;
  if (typeof Notification === "undefined") return false;

  if (isCapacitorNative()) {
    return false;
  }

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIos && !isPwaStandalone()) return false;

  return true;
}

/** Demande auto la permission (desktop + Android PWA). iOS PWA exige un geste utilisateur. */
export function shouldAutoPromptForPush(): boolean {
  if (typeof window === "undefined") return false;
  // iOS/Android natif : jetons via NativePushBootstrap (Capacitor).
  if (isCapacitorNative()) return false;
  if (!isWebPushRegistrationAllowed()) return false;
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIos && isPwaStandalone()) return false;
  return true;
}
