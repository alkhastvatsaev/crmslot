import type * as admin from "firebase-admin";
import type { CompanyCrmActivityDoc } from "./crmActivityLog";

/** Écriture journal CRM via Firebase Admin (routes API / chatbot serveur). */
export async function logCompanyCrmActivityAdmin(
  db: admin.firestore.Firestore,
  payload: CompanyCrmActivityDoc,
): Promise<string> {
  const ref = await db
    .collection("companies")
    .doc(payload.companyId.trim())
    .collection("crm_activity")
    .add({
      ...payload,
      at: payload.at || new Date().toISOString(),
    });
  return ref.id;
}
