/**
 * API publique inbox — notifications in-app cloche (≠ inbox backoffice).
 */
export type { InboxNotificationType, InboxNotification } from "@/features/inbox/types";
export { INBOX_TYPE_ICONS } from "@/features/inbox/types";
export {
  subscribeInbox,
  createInboxNotification,
  markNotificationRead,
  markAllRead,
  buildNotification,
} from "@/features/inbox/inboxFirestore";
