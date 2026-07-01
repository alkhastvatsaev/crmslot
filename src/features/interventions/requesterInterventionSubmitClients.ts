import type { User } from "firebase/auth";
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
import type { RequesterProfile } from "@/context/RequesterHubContext";

export type RequesterSubmitClients = {
  user: User;
  db: Firestore;
  storage: FirebaseStorage | null;
};

/** Connexion SSO / magic link → session `clientPortalAuth` + Firestore associé. */
export function usesClientPortalSession(profileType: RequesterProfile["type"]): boolean {
  return profileType === "login" || profileType === "register";
}

export function resolveRequesterSessionAuth(profileType: RequesterProfile["type"]) {
  return usesClientPortalSession(profileType) ? clientPortalAuth : auth;
}

export function resolveRequesterSubmitClients(
  profileType: RequesterProfile["type"],
  user: User
): RequesterSubmitClients | null {
  if (usesClientPortalSession(profileType)) {
    if (!clientPortalFirestore) return null;
    return { user, db: clientPortalFirestore, storage: clientPortalStorage };
  }
  if (!firestore) return null;
  return { user, db: firestore, storage };
}
