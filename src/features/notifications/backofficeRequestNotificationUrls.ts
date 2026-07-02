import { BM_BACKOFFICE_REQUEST_PARAM } from "@/features/notifications/notificationConstants";
import { NEW_CLIENT_REQUEST_PUSH_TYPE } from "@/features/notifications/server/notifyStaffNewClientRequestAdmin";

export type BackofficeRequestNotificationIntent =
  | { kind: "request"; interventionId: string }
  | { kind: "none" };

export function parseBackofficeRequestNotificationSearchParams(
  searchParams: URLSearchParams
): BackofficeRequestNotificationIntent {
  const raw = searchParams.get(BM_BACKOFFICE_REQUEST_PARAM)?.trim();
  if (!raw) return { kind: "none" };
  return { kind: "request", interventionId: raw };
}

export function parseBackofficeRequestNotificationData(
  data: Record<string, string | undefined>
): BackofficeRequestNotificationIntent {
  const fromParam = data[BM_BACKOFFICE_REQUEST_PARAM]?.trim();
  if (fromParam) return { kind: "request", interventionId: fromParam };

  if (data.type?.trim() !== NEW_CLIENT_REQUEST_PUSH_TYPE) return { kind: "none" };

  const ivId = data.interventionId?.trim();
  if (!ivId) return { kind: "none" };
  return { kind: "request", interventionId: ivId };
}
