import type { FirebaseApp } from "firebase/app";
import { logger } from "@/core/logger";

/**
 * Initialise Firebase App Check côté navigateur (reCAPTCHA v3).
 * Variables :
 *   - `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` : clé site reCAPTCHA v3 (obligatoire en prod).
 *   - `NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` : token debug (dev uniquement) — visible côté
 *     Firebase Console → App Check → Apps → Debug tokens.
 *
 * Sans clé site, l'init est silencieusement ignorée pour ne pas casser le boot client
 * (utile en local sans App Check configuré). Activer l'enforcement côté console Firebase
 * (Firestore + Storage + Functions) uniquement après que les apps clientes envoient des tokens.
 */
export function maybeInitializeAppCheck(app: FirebaseApp): void {
  if (typeof window === "undefined") return;

  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY?.trim();
  if (!siteKey) return;

  const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim();
  if (debugToken) {
    (
      globalThis as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  /** Import paresseux : évite d'embarquer reCAPTCHA dans le bundle si App Check n'est pas configuré. */
  void import("firebase/app-check")
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (error) {
        logger.warn("[appCheck] init failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })
    .catch((error) => {
      logger.warn("[appCheck] dynamic import failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
}
