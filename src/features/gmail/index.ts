/**
 * API publique gmail — hub Gmail carrousel (OAuth, lecture/envoi, lien intervention).
 * UI slot pager → `components/GmailHubPage.tsx`.
 */
export {
  GMAIL_HUB_SLOT_INDEX,
  GMAIL_HUB_SYSTEM_LABELS,
  GMAIL_HUB_PAGE_SIZE,
} from "@/features/gmail/gmailHubConstants";
export type {
  GmailHubStatus,
  GmailHubLabel,
  GmailHubMessageSummary,
  GmailHubAttachment,
  GmailHubMessageDetail,
  GmailHubInboxPage,
} from "@/features/gmail/gmailHubTypes";
export {
  fetchGmailHubStatus,
  fetchGmailHubLabels,
  fetchGmailHubMessages,
  modifyGmailHubMessage,
  fetchGmailHubThread,
  sendGmailHubMessage,
  fetchGmailHubAttachment,
  disconnectGmailHubAccount,
  trashGmailHubMessage,
} from "@/features/gmail/gmailHubApi";
export { useGmailHub } from "@/features/gmail/useGmailHub";
export { useGmailHubPageController } from "@/features/gmail/hooks/useGmailHubPageController";
export { wrapHtmlEmail } from "@/features/gmail/gmailHubWrapHtmlEmail";
export { patchUnreadInList } from "@/features/gmail/gmailHubMessagePatches";
export { extractInterventionFieldsFromEmail } from "@/features/gmail/extractInterventionFieldsFromEmail";
export {
  mapGmailLabel,
  mapGmailMessageSummary,
  mapGmailMessageDetail,
} from "@/features/gmail/gmailHubMappers";
export { parseSenderName, parseSenderEmail } from "@/features/gmail/gmailSenderParse";
export type { GmailLinkCandidate } from "@/features/gmail/useGmailHubLinkIntervention";
