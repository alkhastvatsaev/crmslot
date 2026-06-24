import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import {
  auth,
  clientPortalAuth,
  clientPortalFirestore,
  clientPortalStorage,
  firestore,
  storage,
} from "@/core/config/firebase";

export type PortalChatFirebaseSession = {
  chatAuth: Auth | null;
  chatDb: Firestore | null;
  chatStorage: FirebaseStorage | null;
};

/**
 * Portail demandeur : `clientPortalAuth` + Firestore lié (anonyme ou compte vérifié).
 * Inbox admin / staff : auth CRM principal.
 */
export function resolvePortalChatFirebaseSession(
  publishAsPortal: boolean
): PortalChatFirebaseSession {
  if (!publishAsPortal) {
    return { chatAuth: auth, chatDb: firestore, chatStorage: storage };
  }

  if (!clientPortalAuth) {
    return { chatAuth: null, chatDb: null, chatStorage: null };
  }

  return {
    chatAuth: clientPortalAuth,
    chatDb: clientPortalFirestore ?? firestore,
    chatStorage: clientPortalStorage ?? storage,
  };
}
