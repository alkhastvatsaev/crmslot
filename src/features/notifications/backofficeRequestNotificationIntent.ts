import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DashboardPagerApi } from "@/features/dashboard";
import { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";
import { BM_BACKOFFICE_REQUEST_PARAM } from "@/features/notifications/notificationConstants";
import type { BackofficeRequestNotificationIntent } from "@/features/notifications/backofficeRequestNotificationUrls";

export const BACKOFFICE_REQUEST_NOTIFICATION_INTENT_EVENT =
  "crmslot:backoffice-request-notification-intent";

export function dispatchBackofficeRequestNotificationIntent(
  intent: BackofficeRequestNotificationIntent
): void {
  if (typeof window === "undefined" || intent.kind === "none") return;
  window.dispatchEvent(
    new CustomEvent<BackofficeRequestNotificationIntent>(
      BACKOFFICE_REQUEST_NOTIFICATION_INTENT_EVENT,
      { detail: intent }
    )
  );
}

export function applyBackofficeRequestNotificationIntent(
  intent: BackofficeRequestNotificationIntent,
  ctx: {
    pager: DashboardPagerApi | null | undefined;
    setPendingInboxId: (id: string | null) => void;
    router: Pick<AppRouterInstance, "replace">;
    searchParams?: URLSearchParams;
  }
): void {
  if (intent.kind === "none") return;

  ctx.pager?.setPageIndex(BACKOFFICE_HUB_SLOT_INDEX);
  ctx.setPendingInboxId(intent.interventionId);

  if (!ctx.searchParams) return;

  const next = new URLSearchParams(ctx.searchParams.toString());
  next.delete(BM_BACKOFFICE_REQUEST_PARAM);
  const qs = next.toString();
  const nextPath = qs ? `/?${qs}` : "/";
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", nextPath);
  }
  ctx.router.replace(nextPath, { scroll: false });
}
