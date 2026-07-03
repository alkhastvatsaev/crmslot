import { collection, deleteDoc, getDocs } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

/** Supprime les jetons Web Push (PWA / Chrome) après enregistrement natif Capacitor. */
export async function purgeWebFcmTokensForUser(uid: string): Promise<void> {
  const db = firestore;
  if (!db || !uid.trim()) return;

  const snap = await getDocs(collection(db, "users", uid.trim(), "fcm_tokens"));
  await Promise.all(
    snap.docs
      .filter((docSnap) => {
        const platform = String(docSnap.data()?.platform ?? "web").trim();
        return platform === "web" || platform === "";
      })
      .map((docSnap) => deleteDoc(docSnap.ref).catch(() => null))
  );
}
