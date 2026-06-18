export type AndroidInstallPromoSurface = "admin" | "demande" | "technician";

const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return true;
  if (typeof window.matchMedia !== "function") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

/** Chrome Android navigateur — pas WebView Capacitor (`; wv)`). */
export function isAndroidChromeBrowser(userAgent: string): boolean {
  const ua = userAgent || "";
  if (!/Android/i.test(ua)) return false;
  if (/wv\)/i.test(ua)) return false;
  return /Chrome\//i.test(ua);
}

export function shouldSuggestAndroidAppInstall(opts: {
  userAgent: string;
  isCapacitorNative: boolean;
  isPwaStandalone: boolean;
}): boolean {
  if (opts.isCapacitorNative) return false;
  if (opts.isPwaStandalone) return false;
  return isAndroidChromeBrowser(opts.userAgent);
}

export function androidInstallPromoDismissStorageKey(surface: AndroidInstallPromoSurface): string {
  return `crmslot:android-install-promo:dismissed:${surface}`;
}

export function readAndroidInstallPromoDismissedUntil(
  surface: AndroidInstallPromoSurface,
  nowMs = Date.now()
): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(androidInstallPromoDismissStorageKey(surface));
    if (!raw) return null;
    const until = Number.parseInt(raw, 10);
    if (!Number.isFinite(until) || until <= nowMs) {
      window.localStorage.removeItem(androidInstallPromoDismissStorageKey(surface));
      return null;
    }
    return until;
  } catch {
    return null;
  }
}

export function isAndroidInstallPromoDismissed(
  surface: AndroidInstallPromoSurface,
  nowMs = Date.now()
): boolean {
  return readAndroidInstallPromoDismissedUntil(surface, nowMs) !== null;
}

export function dismissAndroidInstallPromo(
  surface: AndroidInstallPromoSurface,
  nowMs = Date.now()
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      androidInstallPromoDismissStorageKey(surface),
      String(nowMs + DISMISS_MS)
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearAndroidInstallPromoDismissed(surface: AndroidInstallPromoSurface): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(androidInstallPromoDismissStorageKey(surface));
  } catch {
    /* ignore */
  }
}
