import * as admin from "firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";

/** Liste les UIDs des admins actifs d'une société (broadcast push dispatcher). */
export async function listAdminUidsForCompany(companyId: string): Promise<string[]> {
  try {
    const db = getAdminDb();
    const staff = await listCompanyStaff(db, admin.auth, companyId);
    return staff
      .filter((member) => member.role === "admin" && member.active !== false)
      .map((member) => member.uid)
      .filter((uid): uid is string => typeof uid === "string" && uid.length > 0);
  } catch (err) {
    logger.warn("[notifications] listAdminUidsForCompany failed", {
      companyId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export function resolveRecipientEmail(
  role: string,
  variables: Record<string, string>
): string | null {
  if (role === "dispatcher") {
    return process.env.DISPATCH_NOTIFICATION_EMAIL || process.env.GMAIL_USER || null;
  }
  if (role === "client") {
    return variables.clientEmail || null;
  }
  if (role === "technician") {
    return variables.technicianEmail || null;
  }
  return null;
}
