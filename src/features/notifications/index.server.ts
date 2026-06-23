/**
 * API serveur notifications — push FCM Admin (routes API / cron uniquement).
 */
export { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
export type {
  SendNativePushParams,
  SendNativePushResult,
} from "@/features/notifications/sendNativePushAdmin";
export { notifyCompanyAdminsPush } from "@/features/notifications/notifyCompanyAdminsPush";
export type { NotifyAdminsResult } from "@/features/notifications/notifyCompanyAdminsPush";
