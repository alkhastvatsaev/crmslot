import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { auth, clientPortalAuth, clientPortalFirestore, firestore } from "@/core/config/firebase";
import { isVerifiedClientPortalUser } from "@/features/auth/hooks/useClientPortalAccount";

export type IvanaChatFirebaseSession = {
  chatAuth: Auth | null;
  chatDb: Firestore | null;
};

/**
 * Portail demandeur : `clientPortalAuth` + Firestore lié (même jeton que la connexion client).
 * Inbox admin / staff : auth CRM principal.
 */
export function resolveIvanaChatFirebaseSession(
  publishAsPortal: boolean
): IvanaChatFirebaseSession {
  if (!publishAsPortal) {
    return { chatAuth: auth, chatDb: firestore };
  }

  const portalUser = clientPortalAuth?.currentUser ?? null;
  if (isVerifiedClientPortalUser(portalUser)) {
    return {
      chatAuth: clientPortalAuth,
      chatDb: clientPortalFirestore ?? firestore,
    };
  }

  return { chatAuth: auth, chatDb: firestore };
}
