import { doc, getDoc, type Firestore } from "firebase/firestore";
import {
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from "./notificationPreferences";

/** Charge les préférences client depuis `client_portal_profiles/{uid}`. */
export async function loadClientNotificationPreferences(
  db: Firestore,
  uid: string
): Promise<NotificationPreferences> {
  const snap = await getDoc(doc(db, "client_portal_profiles", uid));
  if (!snap.exists()) return normalizeNotificationPreferences(null);
  const raw = snap.data()?.notificationPreferences;
  return normalizeNotificationPreferences(raw);
}

/** Charge les préférences staff depuis `users/{uid}` (doc racine). */
export async function loadStaffNotificationPreferences(
  db: Firestore,
  uid: string
): Promise<NotificationPreferences> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return normalizeNotificationPreferences(null);
  const raw = snap.data()?.notificationPreferences;
  return normalizeNotificationPreferences(raw);
}
