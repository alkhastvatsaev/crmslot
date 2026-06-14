import { signInAnonymously, signOut, type Auth, type User } from "firebase/auth";
import { logger } from "@/core/logger";

/** Utilisateur CRM tenant (custom claims synchronisés via /api/company/sync-claims). */
export function isCrmTenantAuthUser(user: User, tokenClaims: Record<string, unknown>): boolean {
  if (user.isAnonymous) return false;
  const tenants = tokenClaims.bmTenants;
  return Array.isArray(tenants) && tenants.length > 0;
}

/**
 * Ancienne régression : connexion client sur `auth` principal → CRM vide.
 * Si l'utilisateur principal n'a pas de tenant claims, on libère la session CRM.
 */
export async function recoverMainAuthFromClientPortalLeak(
  auth: Auth,
  user: User
): Promise<boolean> {
  if (user.isAnonymous) return false;
  try {
    const token = await user.getIdTokenResult();
    if (isCrmTenantAuthUser(user, token.claims as Record<string, unknown>)) {
      return false;
    }
    await signOut(auth);
    await signInAnonymously(auth);
    return true;
  } catch (e) {
    logger.warn("[recoverMainAuthFromClientPortalLeak] failed", {
      error: e instanceof Error ? e.message : String(e),
      uid: user.uid,
    });
    return false;
  }
}
