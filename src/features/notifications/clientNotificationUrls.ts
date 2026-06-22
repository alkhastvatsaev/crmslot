import {
  BM_CLIENT_CASE_PARAM,
  BM_CLIENT_CHAT_PARAM,
} from "@/features/notifications/notificationConstants";

export type ClientNotificationIntent =
  | { kind: "case"; caseId: string }
  | { kind: "chat"; caseId: string | null }
  | { kind: "none" };

export function parseClientNotificationSearchParams(
  searchParams: URLSearchParams
): ClientNotificationIntent {
  const chatRaw = searchParams.get(BM_CLIENT_CHAT_PARAM)?.trim();
  if (chatRaw) {
    return { kind: "chat", caseId: chatRaw === "open" ? null : chatRaw };
  }

  const caseRaw = searchParams.get(BM_CLIENT_CASE_PARAM)?.trim();
  if (caseRaw) return { kind: "case", caseId: caseRaw };
  return { kind: "none" };
}

export function clientNotificationCaseUrl(origin: string, interventionId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/?${BM_CLIENT_CASE_PARAM}=${encodeURIComponent(interventionId)}`;
}

export function clientNotificationChatUrl(origin: string, interventionId?: string | null): string {
  const base = origin.replace(/\/$/, "");
  const path = base.endsWith("/m/demande") ? base : `${base}/m/demande`;
  const value = interventionId?.trim() || "open";
  return `${path}?${BM_CLIENT_CHAT_PARAM}=${encodeURIComponent(value)}`;
}
