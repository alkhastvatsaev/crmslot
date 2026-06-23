import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DashboardPagerApi } from "@/features/dashboard";
import { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";
import { BM_BACKOFFICE_CHAT_PARAM } from "@/features/notifications/notificationConstants";
import type { BackofficeChatNotificationIntent } from "@/features/notifications/backofficeChatNotificationUrls";

export const BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT =
  "crmslot:backoffice-chat-notification-intent";

export function dispatchBackofficeChatNotificationIntent(
  intent: BackofficeChatNotificationIntent
): void {
  if (typeof window === "undefined" || intent.kind === "none") return;
  window.dispatchEvent(
    new CustomEvent<BackofficeChatNotificationIntent>(BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT, {
      detail: intent,
    })
  );
}

export function applyBackofficeChatNotificationIntent(
  intent: BackofficeChatNotificationIntent,
  ctx: {
    pager: DashboardPagerApi | null | undefined;
    setPendingChatInterventionId: (id: string | null) => void;
    router: Pick<AppRouterInstance, "replace">;
    searchParams?: URLSearchParams;
  }
): void {
  if (intent.kind === "none") return;

  ctx.pager?.setPageIndex(BACKOFFICE_HUB_SLOT_INDEX);
  ctx.setPendingChatInterventionId(intent.interventionId);

  if (!ctx.searchParams) return;

  const next = new URLSearchParams(ctx.searchParams.toString());
  next.delete(BM_BACKOFFICE_CHAT_PARAM);
  const qs = next.toString();
  const nextPath = qs ? `/?${qs}` : "/";
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", nextPath);
  }
  ctx.router.replace(nextPath, { scroll: false });
}
