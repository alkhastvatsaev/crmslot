import { signInAnonymously, type User } from "firebase/auth";
import { auth, clientPortalAuth, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { RequesterProfile } from "@/context/RequesterHubContext";

export const REQUESTER_GEOLOC_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8_000,
  maximumAge: 300_000,
};

export function withRequesterFormTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg: string = "Request timeout"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function ensureRequesterUserForSubmit(
  profileType: RequesterProfile["type"]
): Promise<User | null> {
  if (!isConfigured) return null;

  if (profileType === "login" || profileType === "register") {
    const clientUser = clientPortalAuth?.currentUser ?? null;
    if (clientUser && !clientUser.isAnonymous && clientUser.emailVerified) {
      return clientUser;
    }
    return null;
  }

  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await withRequesterFormTimeout(signInAnonymously(auth), 10000, "Auth timeout");
    return cred.user;
  } catch (err) {
    logger.error("signInAnonymously error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
