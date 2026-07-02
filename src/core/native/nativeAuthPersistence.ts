import { browserLocalPersistence, setPersistence, type Auth } from "firebase/auth";
import { logger } from "@/core/logger";

const persistenceApplied = new WeakSet<Auth>();

/** Persistance locale — session survit fermeture app / onglet (web + Capacitor). */
export async function ensureAuthPersistence(auth: Auth | null): Promise<void> {
  if (!auth || persistenceApplied.has(auth)) return;
  persistenceApplied.add(auth);
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    persistenceApplied.delete(auth);
    logger.warn("[authPersistence] setPersistence failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** @deprecated Utiliser ensureAuthPersistence */
export const ensureNativeAuthPersistence = ensureAuthPersistence;

/** Test-only reset. */
export function resetNativeAuthPersistenceForTests(): void {
  // WeakSet cannot be cleared — tests should use fresh Auth instances.
}
