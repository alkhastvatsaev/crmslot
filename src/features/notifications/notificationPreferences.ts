/**
 * Préférences de notifications par canal.
 * Staff : `users/{uid}.notificationPreferences` — Client portail :
 * `client_portal_profiles/{uid}.notificationPreferences`.
 */

export type NotificationChannel = "email" | "sms" | "push" | "whatsapp";

export type NotificationPreferences = Record<NotificationChannel, boolean>;

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["email", "sms", "push", "whatsapp"];

/** Opt-out par défaut : tout activé (comportement historique). */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  sms: true,
  push: true,
  whatsapp: true,
};

/** Normalise une valeur Firestore arbitraire en préférences valides. */
export function normalizeNotificationPreferences(raw: unknown): NotificationPreferences {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (raw == null || typeof raw !== "object") return prefs;
  const record = raw as Record<string, unknown>;
  for (const channel of NOTIFICATION_CHANNELS) {
    if (typeof record[channel] === "boolean") {
      prefs[channel] = record[channel] as boolean;
    }
  }
  return prefs;
}

export function channelAllowed(
  preferences: Partial<NotificationPreferences> | null | undefined,
  channel: NotificationChannel
): boolean {
  if (!preferences) return true;
  return preferences[channel] !== false;
}
