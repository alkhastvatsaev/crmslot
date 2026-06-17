import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const COMPANY_STAFF_DIRECTORY_COLLECTION = "staff_directory";

/** Index serveur des UIDs membres — évite collectionGroup sur company_memberships. */
export async function upsertCompanyStaffDirectoryEntry(
  db: admin.firestore.Firestore,
  companyId: string,
  uid: string,
  role: "admin" | "collaborateur"
): Promise<void> {
  const trimmedCompanyId = companyId.trim();
  const trimmedUid = uid.trim();
  if (!trimmedCompanyId || !trimmedUid) return;

  await db
    .doc(`companies/${trimmedCompanyId}/${COMPANY_STAFF_DIRECTORY_COLLECTION}/${trimmedUid}`)
    .set(
      {
        uid: trimmedUid,
        companyId: trimmedCompanyId,
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function listStaffDirectoryUids(
  db: admin.firestore.Firestore,
  companyId: string
): Promise<string[]> {
  const snap = await db
    .collection(`companies/${companyId.trim()}/${COMPANY_STAFF_DIRECTORY_COLLECTION}`)
    .get();
  return snap.docs.map((doc) => doc.id);
}
