/**
 * Backoff exponentiel pour les retries de la queue offline.
 * Bornes : 30s pour le 1er échec → max 30min (=1800s) après 6+ tentatives.
 */
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 30 * 60_000;

/** Retourne le timestamp epoch après lequel un item ayant échoué `attemptCount` fois peut être renvoyé. */
export function nextRetryAfter(attemptCount: number, nowMs: number = Date.now()): number {
  const safeAttempt = Math.max(1, attemptCount);
  const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * Math.pow(2, safeAttempt - 1));
  return nowMs + delay;
}

/** Vrai si l'item est éligible à un retry maintenant. */
export function isRetryDue(
  record: { nextAttemptAtMs?: number },
  nowMs: number = Date.now()
): boolean {
  if (record.nextAttemptAtMs == null) return true;
  return record.nextAttemptAtMs <= nowMs;
}
