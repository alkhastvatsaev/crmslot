import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";

export type NotifyAdminsResult = {
  broadcastTo: number;
  sent: number;
  failed: number;
  removedStale: number;
};

/**
 * Envoie un push à tous les admins actifs d'une société. À utiliser dans les
 * webhooks et flows serveur (Stripe paid, eSign signed, refus tech, etc.) où
 * aucun client PWA ne tourne pour appeler /api/notifications/send.
 *
 * `data` est passé au payload FCM (utile pour le routage du clic côté mobile).
 */
export async function notifyCompanyAdminsPush(params: {
  companyId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<NotifyAdminsResult> {
  const result: NotifyAdminsResult = { broadcastTo: 0, sent: 0, failed: 0, removedStale: 0 };
  const companyId = params.companyId?.trim();
  if (!companyId) return result;
  if (!admin.apps.length) return result;

  let adminUids: string[];
  try {
    const staff = await listCompanyStaff(admin.firestore(), admin.auth, companyId);
    adminUids = staff
      .filter((member) => member.role === "admin" && member.active !== false)
      .map((member) => member.uid)
      .filter((uid): uid is string => typeof uid === "string" && uid.length > 0);
  } catch (err) {
    logger.warn("[notifyCompanyAdminsPush] listCompanyStaff failed", {
      companyId,
      error: err instanceof Error ? err.message : String(err),
    });
    return result;
  }

  result.broadcastTo = adminUids.length;
  if (adminUids.length === 0) return result;

  for (const uid of adminUids) {
    try {
      const report = await sendNativePushToUser({
        uid,
        title: params.title,
        body: params.body,
        audiences: ["backoffice", "technician"],
        data: params.data,
      });
      result.sent += report.sent;
      result.failed += report.failed;
      result.removedStale += report.removedStale;
    } catch (err) {
      result.failed += 1;
      logger.warn("[notifyCompanyAdminsPush] sendNativePushToUser failed", {
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
