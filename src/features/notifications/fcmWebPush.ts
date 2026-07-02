import { doc, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";
import { clientPortalFirestore, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";

export type FcmUiStatus =
  | "idle"
  | "unsupported"
  | "blocked"
  | "needs_vapid"
  | "needs_sign_in"
  | "not_client"
  | "registering"
  | "registered"
  | "error";

const SW_READY_MS = 14_000;

import { isMobileServiceWorkerAllowed } from "@/core/pwa/mobileServiceWorkerPolicy";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

export { isWebPushRegistrationAllowed };

/** Service worker PWA enregistré (false en dev sans PWA). */
export function isPushServiceWorkerEnabled(): boolean {
  return isMobileServiceWorkerAllowed();
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** @deprecated Préférer `isWebPushRegistrationAllowed`. */
export function isWebPushDeliveryCapable(): boolean {
  return isWebPushRegistrationAllowed();
}

/** Indique si le device est iOS (pour messages UI). */
export function isIosWebPushDevice(): boolean {
  return isIosDevice();
}

/** Attendu en dev local sans PWA — pas de bruit console. */
export class PushServiceWorkerUnavailableError extends Error {
  constructor() {
    super(
      "Service worker indisponible. En local : lancez « npm run dev:pwa ». En production : build + start (HTTPS)."
    );
    this.name = "PushServiceWorkerUnavailableError";
  }
}

export function isPushServiceWorkerUnavailableError(
  e: unknown
): e is PushServiceWorkerUnavailableError {
  return e instanceof PushServiceWorkerUnavailableError;
}

export function handleFcmSyncError(
  e: unknown,
  setStatus: (status: FcmUiStatus) => void,
  setLastError: (message: string | null) => void,
  opts?: { logTag?: string; surfaceErrorInUi?: boolean }
): void {
  if (isPushServiceWorkerUnavailableError(e)) {
    setStatus("idle");
    setLastError(opts?.surfaceErrorInUi ? e.message : null);
    return;
  }
  if (opts?.logTag) {
    logger.error(opts.logTag, { error: e instanceof Error ? e.message : String(e) });
  }
  setStatus("error");
  setLastError(e instanceof Error ? e.message : String(e));
}

export async function resolvePushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker non supporté par ce navigateur.");
  }

  if (!isPushServiceWorkerEnabled()) {
    throw new PushServiceWorkerUnavailableError();
  }

  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => {
      setTimeout(() => {
        reject(new PushServiceWorkerUnavailableError());
      }, SW_READY_MS);
    }),
  ]);
}

export type FcmPlatform = "web" | "ios" | "android";
export type FcmAudience = "technician" | "client" | "backoffice";

const PLATFORM_PREFIX: Record<FcmPlatform, string> = {
  web: "w",
  ios: "i",
  android: "a",
};

const AUDIENCE_PREFIX: Record<FcmAudience, string> = {
  backoffice: "b",
  technician: "t",
  client: "c",
};

export function tokenDocId(
  token: string,
  platform: FcmPlatform = "web",
  audience?: FcmAudience
): string {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
  }
  const audienceKey = audience ? AUDIENCE_PREFIX[audience] : "x";
  return `${PLATFORM_PREFIX[platform]}${audienceKey}_${Math.abs(h).toString(36)}`;
}

export function resolveFirestoreForFcmAudience(audience: FcmAudience): Firestore {
  if (audience === "client") {
    if (!clientPortalFirestore) throw new Error("Firestore portail client indisponible");
    return clientPortalFirestore;
  }
  if (!firestore) throw new Error("Firestore indisponible");
  return firestore;
}

export async function persistFcmToken(
  uid: string,
  token: string,
  audience: FcmAudience,
  platform: FcmPlatform = "web"
): Promise<void> {
  const db = resolveFirestoreForFcmAudience(audience);
  await setDoc(doc(db, "users", uid, "fcm_tokens", tokenDocId(token, platform, audience)), {
    token,
    platform,
    audience,
    updatedAt: serverTimestamp(),
  });
}

/** Un même jeton natif peut servir admin + terrain — une entrée Firestore par audience. */
export async function persistFcmTokenAudiences(
  uid: string,
  token: string,
  audiences: readonly FcmAudience[],
  platform: FcmPlatform = "web"
): Promise<void> {
  for (const audience of audiences) {
    await persistFcmToken(uid, token, audience, platform);
  }
}
