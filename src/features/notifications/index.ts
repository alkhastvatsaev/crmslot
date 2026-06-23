/**
 * API publique notifications — push FCM, préférences, rappels RDV.
 * Bootstraps montés dans les providers dashboard / mobile.
 */
export { default as BackofficePushBootstrap } from "@/features/notifications/components/BackofficePushBootstrap";
export { default as BackofficeChatNotificationBootstrap } from "@/features/notifications/components/BackofficeChatNotificationBootstrap";
export { default as ClientPortalNotificationBootstrap } from "@/features/notifications/components/ClientPortalNotificationBootstrap";
export { default as TechnicianNotificationBootstrap } from "@/features/notifications/components/TechnicianNotificationBootstrap";
export { default as NativePushBootstrap } from "@/features/notifications/NativePushBootstrap";
export { default as NotificationPreferencesPanel } from "@/features/notifications/components/NotificationPreferencesPanel";
export { default as TechnicianPushNotificationPanel } from "@/features/notifications/components/TechnicianPushNotificationPanel";
export {
  ClientPortalPushProvider,
  useClientPortalPush,
} from "@/features/notifications/ClientPortalPushContext";
export { useBackofficePushMessaging } from "@/features/notifications/useBackofficePushMessaging";
export type { BackofficePushApi } from "@/features/notifications/useBackofficePushMessaging";
export {
  useTechnicianPushMessaging,
  deleteStoredFcmToken,
} from "@/features/notifications/useTechnicianPushMessaging";
export { useNativePushRegistration } from "@/features/notifications/useNativePushRegistration";
export { useClientPortalPushMessaging } from "@/features/notifications/useClientPortalPushMessaging";
export type { ClientPortalPushApi } from "@/features/notifications/useClientPortalPushMessaging";
export {
  isPushServiceWorkerEnabled,
  persistFcmToken,
  handleFcmSyncError,
  resolvePushServiceWorkerRegistration,
  tokenDocId,
  PushServiceWorkerUnavailableError,
  isPushServiceWorkerUnavailableError,
} from "@/features/notifications/fcmWebPush";
export type { FcmUiStatus, FcmPlatform, FcmAudience } from "@/features/notifications/fcmWebPush";
export { isFirebasePublicConfigured } from "@/features/notifications/firebasePublicConfig";
export {
  normalizeNotificationPreferences,
  channelAllowed,
  NOTIFICATION_CHANNELS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@/features/notifications/notificationPreferences";
export type {
  NotificationChannel,
  NotificationPreferences,
} from "@/features/notifications/notificationPreferences";
export {
  loadClientNotificationPreferences,
  loadStaffNotificationPreferences,
} from "@/features/notifications/loadNotificationPreferences";
export {
  dispatchStatusNotifications,
  buildNotificationPayloads,
} from "@/features/notifications/dispatchStatusNotifications";
export type {
  NotificationPayload,
  DispatchNotificationsParams,
} from "@/features/notifications/dispatchStatusNotifications";
export { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
export type {
  SendNativePushParams,
  SendNativePushResult,
} from "@/features/notifications/sendNativePushAdmin";
export { notifyCompanyAdminsPush } from "@/features/notifications/notifyCompanyAdminsPush";
export type { NotifyAdminsResult } from "@/features/notifications/notifyCompanyAdminsPush";
export {
  parseClientNotificationSearchParams,
  clientNotificationCaseUrl,
  clientNotificationChatUrl,
} from "@/features/notifications/clientNotificationUrls";
export type { ClientNotificationIntent } from "@/features/notifications/clientNotificationUrls";
export { parseTechnicianNotificationSearchParams } from "@/features/notifications/technicianNotificationUrls";
export type { TechnicianNotificationIntent } from "@/features/notifications/technicianNotificationUrls";
export {
  parseTechnicianNotificationData,
  dispatchTechnicianNotificationIntent,
  applyTechnicianNotificationIntent,
  TECHNICIAN_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/technicianNotificationIntent";
export {
  parseBackofficeChatNotificationSearchParams,
  parseBackofficeChatNotificationData,
} from "@/features/notifications/backofficeChatNotificationUrls";
export type { BackofficeChatNotificationIntent } from "@/features/notifications/backofficeChatNotificationUrls";
export {
  dispatchBackofficeChatNotificationIntent,
  applyBackofficeChatNotificationIntent,
  BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/backofficeChatNotificationIntent";
export {
  PUSH_NOTIFICATIONS_SLOT_INDEX,
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
  BM_CLIENT_CASE_PARAM,
  BM_CLIENT_CHAT_PARAM,
  BM_BACKOFFICE_CHAT_PARAM,
} from "@/features/notifications/notificationConstants";
export {
  findDueReminders,
  buildReminderMessage,
} from "@/features/notifications/appointmentReminders";
export type {
  AppointmentReminderType,
  ReminderCandidate,
} from "@/features/notifications/appointmentReminders";
export {
  findLateInterventions,
  findUnpaidInvoices,
  LATE_THRESHOLD_MIN,
  UNPAID_REMINDER_DAYS,
} from "@/features/notifications/operationsTick";
export type {
  LateCandidate,
  UnpaidCandidate,
  UnpaidReminderKey,
} from "@/features/notifications/operationsTick";
export {
  findApplicableRules,
  STATUS_NOTIFICATION_RULES,
} from "@/features/notifications/statusNotificationRules";
export type { StatusNotificationRule } from "@/features/notifications/statusNotificationRules";
