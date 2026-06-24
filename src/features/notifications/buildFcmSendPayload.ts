import type { Message } from "firebase-admin/messaging";
import { resolveAndroidPushChannelId } from "@/features/notifications/androidPushChannels";
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

/**
 * Payload FCM multi-plateforme : webpush (PWA fermée), apns (iOS natif/PWA), android (APK).
 * Sans `webpush`, les jetons web ne reçoivent souvent rien quand l’app est en arrière-plan.
 */
export function buildFcmSendPayload(params: BuildFcmSendPayloadParams): Omit<Message, "token"> {
  const origin = (params.origin ?? resolvePushNotificationOrigin()).replace(/\/$/, "");
  const openUrl = resolvePushNotificationOpenUrl(origin, params.data ?? {});
  const data = stringifyFcmData({ ...params.data, url: openUrl });
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
      headers: {
        Urgency: "high",
        TTL: "86400",
      },
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
