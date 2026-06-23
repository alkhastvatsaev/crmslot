/**
 * API publique communications — timeline commentaires et WhatsApp Twilio serveur.
 */
export { CentralizedTimeline } from "@/features/communications/components/CentralizedTimeline";
export {
  sendWhatsAppNotification,
  formatInterventionWhatsApp,
} from "@/features/communications/whatsappNotifications";
export type {
  WhatsAppMessage,
  WhatsAppResult,
} from "@/features/communications/whatsappNotifications";
