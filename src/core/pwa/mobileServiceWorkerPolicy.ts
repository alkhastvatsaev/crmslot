import { isPhoneUserAgent } from "@/core/config/mobileClientDetection";

/** iPhone / Android phone : pas de service worker (chauffe + cache Workbox). */
export function isMobileServiceWorkerAllowed(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  if (process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED !== "true") return false;
  if (process.env.NEXT_PUBLIC_MOBILE_PWA_SW === "true") return true;
  return !isPhoneUserAgent(userAgent);
}

export async function purgeMobileServiceWorkersAndCaches(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister()));

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

/** Empêche next-pwa de ré-enregistrer un SW après purge. */
export function blockServiceWorkerRegistrationOnMobile(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isMobileServiceWorkerAllowed()) return;

  const sw = navigator.serviceWorker;
  const blocked = () =>
    Promise.reject(new Error("Service worker désactivé sur mobile (perf batterie)"));

  try {
    sw.register = blocked as typeof sw.register;
  } catch {
    /* readonly sur certains navigateurs */
  }
}
