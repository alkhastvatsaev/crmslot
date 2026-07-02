import { getCapacitorPlatform, isCapacitorNative } from "@/core/native/capacitorRuntime";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import { isPushServiceWorkerEnabled } from "@/features/notifications/fcmWebPush";

/**
 * Web Push FCM utilisable sur ce device ?
 * - PWA écran d’accueil (iOS obligatoire, Android recommandé)
 * - Capacitor Android : secours si FCM natif indisponible (WebView Chrome)
 */
export function isWebPushRegistrationAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (!isPushServiceWorkerEnabled()) return false;
  if (typeof Notification === "undefined") return false;

  if (isCapacitorNative()) {
    return getCapacitorPlatform() === "android";
  }

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIos && !isPwaStandalone()) return false;

  return true;
}

/** Demande auto la permission dès que Web Push est utilisable (desktop, Android, PWA). */
export function shouldAutoPromptForPush(): boolean {
  if (typeof window === "undefined") return false;
  // iOS/Android natif : jetons via NativePushBootstrap (Capacitor).
  if (isCapacitorNative()) return false;
  return isWebPushRegistrationAllowed();
}
