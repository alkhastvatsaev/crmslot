export const PWA_GIT_SHA_STORAGE_KEY = "crmslot:pwa-git-sha";

export function readDeployedGitSha(): string | null {
  if (typeof document === "undefined") return null;
  const fromMeta = document
    .querySelector('meta[name="application-git-sha"]')
    ?.getAttribute("content")
    ?.trim();
  if (fromMeta) return fromMeta;
  return process.env.NEXT_PUBLIC_APP_GIT_SHA?.trim() || null;
}

export async function purgePwaServiceWorkersAndCaches(): Promise<void> {
  if (typeof navigator === "undefined") return;
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

export function markPwaGitShaStored(deployedSha: string): void {
  try {
    window.localStorage.setItem(PWA_GIT_SHA_STORAGE_KEY, deployedSha);
  } catch {
    /* private mode */
  }
}

export function readStoredPwaGitSha(): string | null {
  try {
    return window.localStorage.getItem(PWA_GIT_SHA_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function pwaReloadOnceKey(deployedSha: string): string {
  return `${PWA_GIT_SHA_STORAGE_KEY}:reload:${deployedSha}`;
}

/** Déjà passé par le reload automatique de secours pour ce SHA. */
export function hasPwaAutoReloadAttempted(deployedSha: string): boolean {
  try {
    return window.sessionStorage.getItem(pwaReloadOnceKey(deployedSha)) === "1";
  } catch {
    return false;
  }
}

export function markPwaAutoReloadAttempted(deployedSha: string): void {
  try {
    window.sessionStorage.setItem(pwaReloadOnceKey(deployedSha), "1");
  } catch {
    /* private mode */
  }
}
