/**
 * API publique emails — fil discussion et CRUD Firestore liés aux interventions.
 */
export { default as InterventionEmailPanel } from "@/features/emails/components/InterventionEmailPanel";
export { useInterventionEmails } from "@/features/emails/useInterventionEmails";
export {
  INTERVENTION_EMAILS_COLLECTION,
  subscribeInterventionEmails,
  markEmailRead,
} from "@/features/emails/interventionEmailFirestore";
export type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
export type { InterventionEmail } from "@/features/emails/types";
export type {
  InterventionEmailComposeState,
  InterventionEmailPanelVariant,
  InterventionEmailPatronView,
} from "@/features/emails/interventionEmailPanelTypes";
export { EMPTY_INTERVENTION_EMAIL_COMPOSE } from "@/features/emails/interventionEmailPanelTypes";
export { formatInterventionEmailTime } from "@/features/emails/formatInterventionEmailTime";
export { useInterventionEmailPanelController } from "@/features/emails/hooks/useInterventionEmailPanelController";
