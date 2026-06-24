import { BM_BACKOFFICE_CHAT_PARAM } from "@/features/notifications/notificationConstants";

export type BackofficeChatNotificationIntent =
  | { kind: "chat"; interventionId: string }
  | { kind: "none" };

export function parseBackofficeChatNotificationSearchParams(
  searchParams: URLSearchParams
): BackofficeChatNotificationIntent {
  const raw = searchParams.get(BM_BACKOFFICE_CHAT_PARAM)?.trim();
  if (!raw) return { kind: "none" };
  return { kind: "chat", interventionId: raw };
}

export function parseBackofficeChatNotificationData(
  data: Record<string, string | undefined>
): BackofficeChatNotificationIntent {
  const fromParam = data[BM_BACKOFFICE_CHAT_PARAM]?.trim();
  if (fromParam) return { kind: "chat", interventionId: fromParam };

  if (data.type?.trim() !== "portal_chat") return { kind: "none" };
  const ivId = data.interventionId?.trim();
  return { kind: "chat", interventionId: ivId || "global" };
}
