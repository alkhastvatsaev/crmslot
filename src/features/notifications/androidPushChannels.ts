/**
 * Canaux Android (FCM `android.notification.channelId`).
 * Doivent être créés côté app via `ensureAndroidPushChannels` avant le 1er push.
 */

export const ANDROID_PUSH_CHANNEL_DEFAULT = "default";
export const ANDROID_PUSH_CHANNEL_CHAT = "chat";
export const ANDROID_PUSH_CHANNEL_OPERATIONS = "operations";

export type AndroidPushChannelSpec = {
  id: string;
  name: string;
  description: string;
  /** Capacitor Importance — 4 = High */
  importance: 4;
  sound: "default";
  vibration: true;
};

/** Canaux créés au boot natif Android — ids alignés avec `resolveAndroidPushChannelId`. */
export const ANDROID_PUSH_CHANNELS: AndroidPushChannelSpec[] = [
  {
    id: ANDROID_PUSH_CHANNEL_DEFAULT,
    name: "Notifications générales",
    description: "Paiements, alertes et mises à jour",
    importance: 4,
    sound: "default",
    vibration: true,
  },
  {
    id: ANDROID_PUSH_CHANNEL_CHAT,
    name: "Messages chat",
    description: "Messages portail client et dispatcher",
    importance: 4,
    sound: "default",
    vibration: true,
  },
  {
    id: ANDROID_PUSH_CHANNEL_OPERATIONS,
    name: "Interventions et rappels",
    description: "Nouvelles missions, statuts et rappels RDV",
    importance: 4,
    sound: "default",
    vibration: true,
  },
];

export function resolveAndroidPushChannelId(data?: Record<string, string>): string {
  const type = data?.type?.trim() ?? "";
  if (type === "portal_chat") return ANDROID_PUSH_CHANNEL_CHAT;
  if (
    type === "assignment" ||
    type === "reminder" ||
    type === "status" ||
    type === "late_technician" ||
    type === "unpaid_invoice"
  ) {
    return ANDROID_PUSH_CHANNEL_OPERATIONS;
  }
  return ANDROID_PUSH_CHANNEL_DEFAULT;
}
