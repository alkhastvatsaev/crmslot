import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company/clientMobileAppConstants";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";
import {
  BM_BACKOFFICE_CHAT_PARAM,
  BM_CLIENT_CASE_PARAM,
  BM_CLIENT_CHAT_PARAM,
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
} from "@/features/notifications/notificationConstants";

export function resolvePushNotificationOrigin(fallback = "https://crmslot.vercel.app"): string {
  return process.env.PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || fallback;
}

const TECHNICIAN_PUSH_TYPES = new Set([
  "assignment",
  "unclosed_dossier",
  "appointment_reminder",
  "daily_reminder",
]);

function technicianAppUrl(base: string, searchParams: URLSearchParams): string {
  const qs = searchParams.toString();
  return qs
    ? `${base}${TECHNICIAN_MOBILE_APP_ROUTE}?${qs}`
    : `${base}${TECHNICIAN_MOBILE_APP_ROUTE}`;
}

function clientAppUrl(base: string, searchParams: URLSearchParams): string {
  const qs = searchParams.toString();
  return qs ? `${base}${CLIENT_MOBILE_APP_ROUTE}?${qs}` : `${base}${CLIENT_MOBILE_APP_ROUTE}`;
}

function isTechnicianPush(data: Record<string, string | undefined>): boolean {
  const pushType = typeof data.type === "string" ? data.type : "";
  const audience = typeof data.audience === "string" ? data.audience : "";
  if (audience === "technician") return true;
  if (TECHNICIAN_PUSH_TYPES.has(pushType)) return true;
  if (data[BM_TECH_CASE_PARAM] || data[BM_TECH_REMINDER_PARAM]) return true;
  return false;
}

function isClientCasePush(
  data: Record<string, string | undefined>,
  pushType: string,
  audience: string
): boolean {
  if (audience === "client") return true;
  return pushType === "payment_received" || pushType === "status_change";
}

/** URL ouverte au clic notif — partagée service worker + payload FCM `webpush.fcmOptions.link`. */
export function resolvePushNotificationOpenUrl(
  origin: string,
  data: Record<string, string | undefined>
): string {
  const base = origin.replace(/\/$/, "");
  const pushType = typeof data.type === "string" ? data.type : "";
  const audience = typeof data.audience === "string" ? data.audience : "";
  const interventionId = typeof data.interventionId === "string" ? data.interventionId : "";

  if (pushType === "portal_chat") {
    if (audience === "client") {
      const chatIv = interventionId.length > 0 ? interventionId : "open";
      return clientAppUrl(base, new URLSearchParams({ [BM_CLIENT_CHAT_PARAM]: chatIv }));
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
    if (isClientCasePush(data, pushType, audience)) {
      return clientAppUrl(base, new URLSearchParams({ [BM_CLIENT_CASE_PARAM]: interventionId }));
    }
    return technicianAppUrl(base, new URLSearchParams({ [BM_TECH_CASE_PARAM]: interventionId }));
  }

  const techCase = typeof data[BM_TECH_CASE_PARAM] === "string" ? data[BM_TECH_CASE_PARAM] : "";
  if (techCase) {
    return technicianAppUrl(base, new URLSearchParams({ [BM_TECH_CASE_PARAM]: techCase }));
  }

  if (isTechnicianPush(data)) {
    return technicianAppUrl(base, new URLSearchParams({ [BM_TECH_REMINDER_PARAM]: "1" }));
  }

  return technicianAppUrl(base, new URLSearchParams({ [BM_TECH_REMINDER_PARAM]: "1" }));
}

/** Préfère la fenêtre PWA dont l’URL correspond à la cible (Terrain / Demande / Admin). */
export function pickPushNotificationWindowClient(
  clientList: readonly { url: string }[],
  targetUrl: string,
  origin: string
): { url: string } | undefined {
  if (!clientList.length) return undefined;

  let targetPath: string;
  try {
    targetPath = new URL(targetUrl, origin).pathname;
  } catch {
    return clientList[0];
  }

  const matchPrefix = (prefix: string) =>
    clientList.find((client) => {
      try {
        return new URL(client.url).pathname.startsWith(prefix);
      } catch {
        return false;
      }
    });

  if (targetPath.startsWith(TECHNICIAN_MOBILE_APP_ROUTE)) {
    return matchPrefix(TECHNICIAN_MOBILE_APP_ROUTE) ?? clientList[0];
  }
  if (targetPath.startsWith(CLIENT_MOBILE_APP_ROUTE)) {
    return matchPrefix(CLIENT_MOBILE_APP_ROUTE) ?? clientList[0];
  }
  if (targetPath === "/" || targetPath === "") {
    return (
      clientList.find((client) => {
        try {
          const path = new URL(client.url).pathname;
          return path === "/" || path === "";
        } catch {
          return false;
        }
      }) ?? clientList[0]
    );
  }

  return clientList[0];
}
