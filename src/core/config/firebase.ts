import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { logger } from "@/core/logger";
import { maybeInitializeAppCheck } from "@/core/config/firebase-app-check";
import { getDatabase, type Database } from "firebase/database";
import {
  enableMultiTabIndexedDbPersistence,
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

/** RTDB uniquement si URL explicite : sans elle, `getDatabase(app)` peut lever au build SSR (Vercel) si la RTDB n’existe pas / URL dérivée invalide. */
function readOptionalRealtimeDatabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return undefined;
    return raw;
  } catch {
    return undefined;
  }
}

const realtimeDatabaseUrl = readOptionalRealtimeDatabaseUrl();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(realtimeDatabaseUrl ? { databaseURL: realtimeDatabaseUrl } : {}),
};

const isConfigured = !!firebaseConfig.projectId;

const app = isConfigured ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

if (app) maybeInitializeAppCheck(app);

/** Auth CRM / back-office — ne pas utiliser pour la connexion client hub société. */
const CLIENT_PORTAL_APP_NAME = "clientPortal";
const clientPortalApp = app
  ? getApps().some((a) => a.name === CLIENT_PORTAL_APP_NAME)
    ? getApp(CLIENT_PORTAL_APP_NAME)
    : initializeApp(firebaseConfig, CLIENT_PORTAL_APP_NAME)
  : null;

const db: Database | null = app && realtimeDatabaseUrl ? getDatabase(app) : null;

/**
 * Une seule instance Firestore par app (évite INTERNAL ASSERTION sur HMR / double init).
 * Long polling uniquement hors navigateur (SSR) — en client WebChannel + persistence est plus stable.
 */
function getOrInitFirestore(firebaseApp: FirebaseApp): Firestore {
  const forceLongPolling =
    typeof window === "undefined" ||
    process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONG_POLLING === "true";

  if (!forceLongPolling) {
    try {
      return getFirestore(firebaseApp);
    } catch {
      /* pas encore initialisé */
    }
    return initializeFirestore(firebaseApp, {});
  }

  try {
    return getFirestore(firebaseApp);
  } catch {
    return initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
  }
}

const firestore = app ? getOrInitFirestore(app) : null;

const auth = app ? getAuth(app) : null;
/** Auth portail client (hub société) — session isolée du CRM admin sur le même onglet. */
const clientPortalAuth = clientPortalApp ? getAuth(clientPortalApp) : null;
/** Firestore lié à `clientPortalAuth` (même jeton que la connexion portail client). */
const clientPortalFirestore = clientPortalApp ? getOrInitFirestore(clientPortalApp) : null;
const storage = app ? getStorage(app) : null;

/** Persistence IndexedDB : utile en prod PWA ; en dev/HMR elle amplifie les races listener (assertion ca9). */
if (typeof window !== "undefined" && firestore && process.env.NODE_ENV === "production") {
  enableMultiTabIndexedDbPersistence(firestore).catch((err: { code?: string }) => {
    if (err.code === "failed-precondition") {
      logger.warn("Le mode hors-ligne ne peut être activé que sur un seul onglet à la fois.");
    } else if (err.code === "unimplemented") {
      logger.warn("Le navigateur actuel ne supporte pas le mode hors-ligne de Firebase.");
    }
  });
}

export {
  app,
  clientPortalApp,
  db,
  firestore,
  clientPortalFirestore,
  auth,
  clientPortalAuth,
  storage,
  isConfigured,
};
