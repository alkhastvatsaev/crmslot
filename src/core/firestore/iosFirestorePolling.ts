import { isIosPhonePowerSave } from "@/core/perf/iosPhonePowerSave";

/** Intervalle fetch ponctuel iPhone (pas de listener WebChannel permanent). */
export const IOS_FIRESTORE_POLL_MS = 45_000;
/** Feature flags / memberships — changent rarement. */
export const IOS_FIRESTORE_SLOW_POLL_MS = 5 * 60_000;

export function shouldUseIosFirestorePolling(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  return isIosPhonePowerSave(userAgent);
}

/**
 * Boucle fetch Firestore sur iPhone — pause si l’onglet est caché.
 * Retourne un cleanup (clear interval + visibility listener).
 */
export function startIosFirestorePoll(
  pull: () => void | Promise<void>,
  documentVisible: boolean,
  pollMs: number = IOS_FIRESTORE_POLL_MS
): () => void {
  if (typeof window === "undefined") return () => {};

  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  const safePull = () => {
    if (cancelled) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    void pull();
  };

  if (documentVisible) {
    safePull();
    timer = setInterval(safePull, pollMs);
  }

  const onVisibility = () => {
    if (cancelled) return;
    if (document.visibilityState === "visible") {
      safePull();
      if (!timer) timer = setInterval(safePull, pollMs);
    } else if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };

  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    cancelled = true;
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
