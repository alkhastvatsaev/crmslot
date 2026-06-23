import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { auth, clientPortalAuth, clientPortalFirestore, firestore } from "@/core/config/firebase";

export type IvanaChatFirebaseSession = {
  chatAuth: Auth | null;
  chatDb: Firestore | null;
};

/**
 * Portail demandeur : `clientPortalAuth` + Firestore lié (anonyme ou compte vérifié).
 * Inbox admin / staff : auth CRM principal.
 */
export function resolveIvanaChatFirebaseSession(
  publishAsPortal: boolean
): IvanaChatFirebaseSession {
  if (!publishAsPortal) {
    return { chatAuth: auth, chatDb: firestore };
  }

  if (!clientPortalAuth) {
    return { chatAuth: null, chatDb: null };
  }

  return {
    chatAuth: clientPortalAuth,
    chatDb: clientPortalFirestore ?? firestore,
  };
}
