import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
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

/** Service worker PWA enregistré (false en `npm run dev` sans `npm run dev:pwa`). */
export function isPushServiceWorkerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PWA_SERVICE_WORKER_ENABLED === "true";
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

export function tokenDocId(token: string): string {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
  }
  return `w_${Math.abs(h).toString(36)}`;
}

export async function persistFcmToken(
  uid: string,
  token: string,
  audience: "technician" | "client"
): Promise<void> {
  if (!firestore) throw new Error("Firestore indisponible");
  await setDoc(doc(firestore, "users", uid, "fcm_tokens", tokenDocId(token)), {
    token,
    platform: "web",
    audience,
    updatedAt: serverTimestamp(),
  });
}
