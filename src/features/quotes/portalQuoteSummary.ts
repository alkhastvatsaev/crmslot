import { effectiveQuoteStatus, quoteCanBeResponded } from "@/features/quotes/quoteExpiration";
import type { Quote, QuoteLine, QuoteStatus } from "@/features/quotes/types";

export type PortalQuoteLineSummary = Pick<QuoteLine, "description" | "quantity" | "unitPriceCents">;

/** Champs devis exposés sur le portail public (lien token). */
export type PortalQuoteSummary = {
  id: string;
  status: QuoteStatus;
  effectiveStatus: QuoteStatus;
  lines: PortalQuoteLineSummary[];
  totalCents: number;
  totalTtcCents: number;
  validityDays: number;
  expiresAt: string | null;
  sentAt: string | null;
  respondedAt: string | null;
  canRespond: boolean;
};

const TVA_RATE = 0.06;

export function quoteTotalTtcCents(totalHtCents: number): number {
  const ht = Math.max(0, Math.round(totalHtCents));
  return ht + Math.round(ht * TVA_RATE);
}

export function toPortalQuoteSummary(quote: Quote, now: Date = new Date()): PortalQuoteSummary {
  const effectiveStatus = effectiveQuoteStatus(quote, now);
  return {
    id: quote.id,
    status: quote.status,
    effectiveStatus,
    lines: quote.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    })),
    totalCents: quote.totalCents,
    totalTtcCents: quoteTotalTtcCents(quote.totalCents),
    validityDays: quote.validityDays,
    expiresAt: quote.expiresAt ?? null,
    sentAt: quote.sentAt ?? null,
    respondedAt: quote.respondedAt ?? null,
    canRespond: quoteCanBeResponded(quote, now),
  };
}

/** Devis visibles côté portail : envoyés ou déjà répondus (pas brouillon). */
export function isQuoteVisibleOnPortal(quote: Quote): boolean {
  return quote.status === "sent" || quote.status === "accepted" || quote.status === "declined";
}
