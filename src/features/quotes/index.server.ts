/**
 * API serveur quotes — acceptation / envoi portail (routes API uniquement).
 */
export { acceptQuoteAdmin } from "@/features/quotes/server/acceptQuoteAdmin";
export type { AcceptQuoteAdminResult } from "@/features/quotes/server/acceptQuoteAdmin";
export { declineQuoteAdmin } from "@/features/quotes/server/declineQuoteAdmin";
export { loadPortalQuotesAdmin } from "@/features/quotes/server/loadPortalQuotesAdmin";
export {
  sendQuoteEmailAdmin,
  buildQuoteEmailBody,
} from "@/features/quotes/server/sendQuoteEmailAdmin";
export { respondQuoteViaPortalAdmin } from "@/features/quotes/server/respondQuoteViaPortalAdmin";
export type {
  PortalQuoteRespondAction,
  PortalQuoteRespondResult,
} from "@/features/quotes/server/respondQuoteViaPortalAdmin";
