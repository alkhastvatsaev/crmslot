/**
 * API publique quotes — devis société, acceptation portail.
 */
export type { Quote, QuoteLine, QuoteStatus } from "@/features/quotes/types";
export {
  subscribeQuotes,
  subscribeQuotesByIntervention,
  createQuote,
  updateQuote,
  updateQuoteStatus,
} from "@/features/quotes/quoteFirestore";
export {
  isQuoteExpired,
  effectiveQuoteStatus,
  quoteCanBeResponded,
} from "@/features/quotes/quoteExpiration";
export {
  toPortalQuoteSummary,
  isQuoteVisibleOnPortal,
  quoteTotalTtcCents,
} from "@/features/quotes/portalQuoteSummary";
export type {
  PortalQuoteSummary,
  PortalQuoteLineSummary,
} from "@/features/quotes/portalQuoteSummary";
export {
  quoteToBillingLines,
  applyQuoteToInterventionBilling,
} from "@/features/quotes/convertQuoteToInvoice";
export {
  buildQuotePdfFromQuote,
  quotePdfFileName,
  downloadQuotePdf,
  quoteAsInterventionForPdf,
} from "@/features/quotes/buildQuotePdfFromQuote";
export { formatQuoteEur, computeQuoteTotals } from "@/features/quotes/quoteEditorPanelUtils";
export type { QuoteEditorPanelProps } from "@/features/quotes/quoteEditorPanelTypes";
export { useQuoteEditorPanelController } from "@/features/quotes/hooks/useQuoteEditorPanelController";
export { default as QuoteListPanel } from "@/features/quotes/components/QuoteListPanel";
export { default as QuoteEditorPanel } from "@/features/quotes/components/QuoteEditorPanel";
export { default as PortalQuotePanel } from "@/features/quotes/components/PortalQuotePanel";
