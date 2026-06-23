import { signInAnonymously, type Auth, type User } from "firebase/auth";
import { logger } from "@/core/logger";

/** Session chat portail — invité anonyme ou compte client déjà connecté. */
export async function ensureClientPortalChatAuth(auth: Auth): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    logger.error("[ensureClientPortalChatAuth] signInAnonymously", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
