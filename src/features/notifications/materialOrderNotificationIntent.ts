import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DashboardPagerApi } from "@/features/dashboard";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { BM_MATERIAL_ORDER_PARAM } from "@/features/notifications/notificationConstants";
import type { MaterialOrderNotificationIntent } from "@/features/notifications/materialOrderNotificationUrls";

export const MATERIAL_ORDER_NOTIFICATION_INTENT_EVENT =
  "crmslot:material-order-notification-intent";

export function dispatchMaterialOrderNotificationIntent(
  intent: MaterialOrderNotificationIntent
): void {
  if (typeof window === "undefined" || intent.kind === "none") return;
  window.dispatchEvent(
    new CustomEvent<MaterialOrderNotificationIntent>(MATERIAL_ORDER_NOTIFICATION_INTENT_EVENT, {
      detail: intent,
    })
  );
}

export function applyMaterialOrderNotificationIntent(
  intent: MaterialOrderNotificationIntent,
  ctx: {
    pager: DashboardPagerApi | null | undefined;
    router: Pick<AppRouterInstance, "replace">;
    searchParams?: URLSearchParams;
  }
): void {
  if (intent.kind === "none") return;

  ctx.pager?.setPageIndex(FEATURE_HUB_SLOT_INDEX);

  if (!ctx.searchParams) return;

  const next = new URLSearchParams(ctx.searchParams.toString());
  next.delete(BM_MATERIAL_ORDER_PARAM);
  const qs = next.toString();
  const nextPath = qs ? `/?${qs}` : "/";
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", nextPath);
  }
  ctx.router.replace(nextPath, { scroll: false });
}
