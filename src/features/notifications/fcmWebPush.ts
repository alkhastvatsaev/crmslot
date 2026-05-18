import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

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

export async function resolvePushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker non supporté par ce navigateur.");
  }
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Aucun service worker actif. En développement : « npm run dev:pwa » ou build + start (HTTPS en prod).",
          ),
        );
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

export async function persistFcmToken(uid: string, token: string, audience: "technician" | "client"): Promise<void> {
  if (!firestore) throw new Error("Firestore indisponible");
  await setDoc(doc(firestore, "users", uid, "fcm_tokens", tokenDocId(token)), {
    token,
    platform: "web",
    audience,
    updatedAt: serverTimestamp(),
  });
}
