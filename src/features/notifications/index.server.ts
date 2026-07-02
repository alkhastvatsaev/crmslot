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
export { notifyMaterialOrderPlacedAdmin } from "@/features/notifications/server/notifyMaterialOrderPlacedAdmin";
export type {
  NotifyMaterialOrderPlacedParams,
  NotifyMaterialOrderPlacedResult,
} from "@/features/notifications/server/notifyMaterialOrderPlacedAdmin";
export { notifyMaterialOrderStatusAdmin } from "@/features/notifications/server/notifyMaterialOrderStatusAdmin";
export type {
  NotifyMaterialOrderStatusParams,
  NotifyMaterialOrderStatusResult,
} from "@/features/notifications/server/notifyMaterialOrderStatusAdmin";
export { runSupplierOrderProgressTickAdmin } from "@/features/notifications/server/runSupplierOrderProgressTickAdmin";
export type { SupplierOrderProgressTickReport } from "@/features/notifications/server/runSupplierOrderProgressTickAdmin";
export { runGoogleReviewRequestsAdmin } from "@/features/notifications/server/runGoogleReviewRequestsAdmin";
export type { GoogleReviewRequestsReport } from "@/features/notifications/server/runGoogleReviewRequestsAdmin";
export { notifyStaffNewClientRequestAdmin } from "@/features/notifications/server/notifyStaffNewClientRequestAdmin";
