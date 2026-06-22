import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";

/** Profil minimal pour `clientPortalLinkedToCompany` (règles Firestore chat). */
export async function ensureIvanaChatPortalProfile(
  db: Firestore,
  user: User,
  companyId: string
): Promise<void> {
  const trimmed = companyId.trim();
  if (!trimmed) return;

  await setDoc(
    doc(db, CLIENT_PORTAL_PROFILE_COLLECTION, user.uid),
    {
      uid: user.uid,
      companyId: trimmed,
      role: "client",
      email: user.email ?? null,
      displayName:
        user.displayName?.trim() || [user.email?.split("@")[0]].filter(Boolean).join(" ") || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
