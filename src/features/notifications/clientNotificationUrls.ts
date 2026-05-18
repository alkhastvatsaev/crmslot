import { BM_CLIENT_CASE_PARAM } from "@/features/notifications/notificationConstants";

export type ClientNotificationIntent =
  | { kind: "case"; caseId: string }
  | { kind: "none" };

export function parseClientNotificationSearchParams(searchParams: URLSearchParams): ClientNotificationIntent {
  const caseRaw = searchParams.get(BM_CLIENT_CASE_PARAM)?.trim();
  if (caseRaw) return { kind: "case", caseId: caseRaw };
  return { kind: "none" };
}

export function clientNotificationCaseUrl(origin: string, interventionId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/?${BM_CLIENT_CASE_PARAM}=${encodeURIComponent(interventionId)}`;
}
