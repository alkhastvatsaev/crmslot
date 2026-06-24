import {
  BM_BACKOFFICE_CHAT_PARAM,
  BM_CLIENT_CHAT_PARAM,
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
} from "@/features/notifications/notificationConstants";

export function resolvePushNotificationOrigin(fallback = "https://crmslot.vercel.app"): string {
  return process.env.PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || fallback;
}

/** URL ouverte au clic notif — partagée service worker + payload FCM `webpush.fcmOptions.link`. */
export function resolvePushNotificationOpenUrl(
  origin: string,
  data: Record<string, string | undefined>
): string {
  const base = origin.replace(/\/$/, "");
  const pushType = typeof data.type === "string" ? data.type : "";
  const interventionId = typeof data.interventionId === "string" ? data.interventionId : "";

  if (pushType === "portal_chat") {
    const audience = typeof data.audience === "string" ? data.audience : "staff";
    if (audience === "client") {
      const chatIv = interventionId.length > 0 ? interventionId : "open";
      return `${base}/m/demande?${BM_CLIENT_CHAT_PARAM}=${encodeURIComponent(chatIv)}`;
    }
    const chatIv =
      typeof data[BM_BACKOFFICE_CHAT_PARAM] === "string" && data[BM_BACKOFFICE_CHAT_PARAM]
        ? data[BM_BACKOFFICE_CHAT_PARAM]
        : interventionId.length > 0
          ? interventionId
          : "global";
    return `${base}/?${BM_BACKOFFICE_CHAT_PARAM}=${encodeURIComponent(chatIv)}`;
  }

  if (interventionId.length > 0) {
    return `${base}/?${BM_TECH_CASE_PARAM}=${encodeURIComponent(interventionId)}`;
  }

  if (typeof data[BM_TECH_CASE_PARAM] === "string" && data[BM_TECH_CASE_PARAM]) {
    return `${base}/?${BM_TECH_CASE_PARAM}=${encodeURIComponent(data[BM_TECH_CASE_PARAM])}`;
  }

  return `${base}/?${BM_TECH_REMINDER_PARAM}=1`;
}
