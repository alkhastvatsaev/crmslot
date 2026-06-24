import type { Message } from "firebase-admin/messaging";
import { resolveAndroidPushChannelId } from "@/features/notifications/androidPushChannels";
import type { FcmPlatform } from "@/features/notifications/fcmWebPush";
import {
  resolvePushNotificationOpenUrl,
  resolvePushNotificationOrigin,
} from "@/features/notifications/resolvePushNotificationOpenUrl";

export function stringifyFcmData(data?: Record<string, string>): Record<string, string> {
  if (!data) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null && value !== "") out[key] = String(value);
  }
  return out;
}

export type BuildFcmSendPayloadParams = {
  title: string;
  body: string;
  data?: Record<string, string>;
  origin?: string;
};

function resolveOriginAndUrl(params: BuildFcmSendPayloadParams): {
  origin: string;
  openUrl: string;
  data: Record<string, string>;
} {
  const origin = (params.origin ?? resolvePushNotificationOrigin()).replace(/\/$/, "");
  const openUrl = resolvePushNotificationOpenUrl(origin, params.data ?? {});
  const data = stringifyFcmData({
    ...params.data,
    title: params.title,
    body: params.body,
    url: openUrl,
  });
  return { origin, openUrl, data };
}

/**
 * Jetons `platform: web` (PWA iPhone/Android) — **data-only**.
 * iOS PWA n’affiche pas les notifs en arrière-plan si le payload contient `notification`
 * (seul `onMessage` au premier plan fonctionne). Le service worker appelle `showNotification`.
 */
export function buildFcmWebDataOnlyPayload(
  params: BuildFcmSendPayloadParams
): Omit<Message, "token"> {
  const { openUrl, data } = resolveOriginAndUrl(params);
  return {
    data,
    webpush: {
      headers: {
        Urgency: "high",
        TTL: "86400",
      },
      fcmOptions: { link: openUrl },
    },
  };
}

/** Jetons natifs Capacitor (`ios` / `android`) — affichage OS quand l’app est fermée. */
export function buildFcmNativePushPayload(
  params: BuildFcmSendPayloadParams
): Omit<Message, "token"> {
  const { origin, openUrl, data } = resolveOriginAndUrl(params);
  const channelId = resolveAndroidPushChannelId(params.data);
  const tag = data.type?.trim() || "crmslot";

  return {
    notification: { title: params.title, body: params.body },
    data,
    android: {
      priority: "high",
      notification: {
        channelId,
        sound: "default",
        clickAction: "OPEN_ACTIVITY",
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
        "apns-push-type": "alert",
      },
      payload: {
        aps: {
          alert: { title: params.title, body: params.body },
          sound: "default",
        },
      },
    },
    webpush: {
      headers: { Urgency: "high", TTL: "86400" },
      notification: {
        title: params.title,
        body: params.body,
        icon: `${origin}/icon-192.png`,
        badge: `${origin}/icon-192.png`,
        tag,
      },
      fcmOptions: { link: openUrl },
    },
  };
}

export function buildFcmPayloadForPlatform(
  platform: FcmPlatform,
  params: BuildFcmSendPayloadParams
): Omit<Message, "token"> {
  if (platform === "web") return buildFcmWebDataOnlyPayload(params);
  return buildFcmNativePushPayload(params);
}

/** @deprecated Préférer `buildFcmPayloadForPlatform` selon le jeton. */
export function buildFcmSendPayload(params: BuildFcmSendPayloadParams): Omit<Message, "token"> {
  return buildFcmNativePushPayload(params);
}

export function normalizeFcmTokenPlatform(raw: unknown): FcmPlatform {
  const p = typeof raw === "string" ? raw.trim() : "";
  if (p === "android" || p === "ios") return p;
  return "web";
}
