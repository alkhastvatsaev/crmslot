/** Service worker PWA — actif sur tous les appareils si configuré. */
export function isMobileServiceWorkerAllowed(
  _userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  return process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED === "true";
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

export function blockServiceWorkerRegistrationOnMobile(): void {
  /* no-op — mode premium : PWA active partout */
}
