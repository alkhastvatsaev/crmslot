import { browserLocalPersistence, setPersistence, type Auth } from "firebase/auth";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";

let persistenceApplied = false;

/** WebView Capacitor : persistance localStorage (session survit fermeture app). */
export async function ensureNativeAuthPersistence(auth: Auth | null): Promise<void> {
  if (!auth || !isCapacitorNative() || persistenceApplied) return;
  persistenceApplied = true;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    persistenceApplied = false;
    logger.warn("[nativeAuthPersistence] setPersistence failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Test-only reset. */
export function resetNativeAuthPersistenceForTests(): void {
  persistenceApplied = false;
}
