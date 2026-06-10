import type { Quote, QuoteStatus } from "./types";

/** Un devis est expiré si non répondu et `expiresAt` dépassée. */
export function isQuoteExpired(quote: Quote, now: Date = new Date()): boolean {
  if (quote.status === "accepted" || quote.status === "declined") return false;
  if (quote.status === "expired") return true;
  if (!quote.expiresAt) return false;
  return new Date(quote.expiresAt).getTime() < now.getTime();
}

/** Statut affiché : `expired` calculé à la lecture (aucun cron requis). */
export function effectiveQuoteStatus(quote: Quote, now: Date = new Date()): QuoteStatus {
  return isQuoteExpired(quote, now) ? "expired" : quote.status;
}

/** Un devis ne peut être accepté/refusé que s'il est `sent` et non expiré. */
export function quoteCanBeResponded(quote: Quote, now: Date = new Date()): boolean {
  return quote.status === "sent" && !isQuoteExpired(quote, now);
}
