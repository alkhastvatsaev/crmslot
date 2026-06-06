import * as admin from "firebase-admin";
import { logger } from "@/core/logger";

function adminAppOptions(credential: admin.credential.Credential): admin.AppOptions {
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  return storageBucket ? { credential, storageBucket } : { credential };
}

function tryInitFirebaseAdmin(): void {
  if (admin.apps.length) return;

  try {
    const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (jsonRaw) {
      const serviceAccount = JSON.parse(jsonRaw) as admin.ServiceAccount;
      admin.initializeApp(adminAppOptions(admin.credential.cert(serviceAccount)));
      return;
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID?.trim() ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp(
        adminAppOptions(
          admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          })
        )
      );
      return;
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
      admin.initializeApp(adminAppOptions(admin.credential.applicationDefault()));
    }
  } catch (error) {
    logger.error("Firebase admin initialization error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

tryInitFirebaseAdmin();

/** Indique si les routes serveur (chatbot commandes, registry) peuvent écrire/lire Admin. */
export function isFirebaseAdminReady(): boolean {
  return admin.apps.length > 0;
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error(
      "Firebase Admin non initialisé. Ajoutez dans .env.local : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (ou FIREBASE_SERVICE_ACCOUNT_JSON)."
    );
  }
  return admin.firestore();
}

export const adminDb = admin.apps.length
  ? admin.firestore()
  : (null as unknown as admin.firestore.Firestore);
