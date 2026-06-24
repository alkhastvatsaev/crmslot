import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DashboardPagerApi } from "@/features/dashboard";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_CLIENT_PORTAL,
} from "@/features/company/companyHubNavigation";
import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company/clientMobileAppConstants";
import {
  BM_CLIENT_CASE_PARAM,
  BM_CLIENT_CHAT_PARAM,
} from "@/features/notifications/notificationConstants";
import {
  parseClientNotificationSearchParams,
  type ClientNotificationIntent,
} from "@/features/notifications/clientNotificationUrls";

export { parseClientNotificationSearchParams };
export type { ClientNotificationIntent };

export const CLIENT_NOTIFICATION_INTENT_EVENT = "crmslot:client-notification-intent";

export function parseClientNotificationData(
  data: Record<string, string | undefined>
): ClientNotificationIntent {
  const chatParam = data[BM_CLIENT_CHAT_PARAM]?.trim();
  if (chatParam) {
    return { kind: "chat", caseId: chatParam === "open" ? null : chatParam };
  }

  const caseParam = data[BM_CLIENT_CASE_PARAM]?.trim();
  if (caseParam) return { kind: "case", caseId: caseParam };

  const pushType = data.type?.trim() ?? "";
  const audience = data.audience?.trim() ?? "";
  const ivId = data.interventionId?.trim();

  if (pushType === "portal_chat" && audience === "client") {
    return { kind: "chat", caseId: ivId || null };
  }
  if (ivId && (pushType === "payment_received" || pushType === "status_change")) {
    return { kind: "case", caseId: ivId };
  }

  return { kind: "none" };
}

export function dispatchClientNotificationIntent(intent: ClientNotificationIntent): void {
  if (typeof window === "undefined" || intent.kind === "none") return;
  window.dispatchEvent(
    new CustomEvent<ClientNotificationIntent>(CLIENT_NOTIFICATION_INTENT_EVENT, {
      detail: intent,
    })
  );
}

export function applyClientNotificationIntent(
  intent: ClientNotificationIntent,
  ctx: {
    pathname: string;
    pager: DashboardPagerApi | null | undefined;
    setLastSubmittedInterventionId: (id: string | null) => void;
    setPendingTrackingInterventionId: (id: string | null) => void;
    setPortalRightTab: (
      tab: "tracking" | "chat" | "invoice" | "documents" | "timeline" | null
    ) => void;
    router: Pick<AppRouterInstance, "replace">;
    searchParams?: URLSearchParams;
  }
): void {
  if (intent.kind === "none") return;

  if (intent.kind === "chat") {
    if (intent.caseId) {
      ctx.setLastSubmittedInterventionId(intent.caseId);
      ctx.setPendingTrackingInterventionId(intent.caseId);
    }
    ctx.setPortalRightTab("chat");
  } else {
    navigateCompanyHub(ctx.pager, COMPANY_HUB_ANCHOR_CLIENT_PORTAL, { pathname: ctx.pathname });
    ctx.setLastSubmittedInterventionId(intent.caseId);
    ctx.setPendingTrackingInterventionId(intent.caseId);
    ctx.setPortalRightTab("tracking");
  }

  if (!ctx.searchParams) return;

  const next = new URLSearchParams(ctx.searchParams.toString());
  next.delete(BM_CLIENT_CASE_PARAM);
  next.delete(BM_CLIENT_CHAT_PARAM);
  const qs = next.toString();
  const basePath = ctx.pathname.startsWith(CLIENT_MOBILE_APP_ROUTE)
    ? CLIENT_MOBILE_APP_ROUTE
    : ctx.pathname;
  const nextPath = qs ? `${basePath}?${qs}` : basePath;
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", nextPath);
  }
  ctx.router.replace(nextPath, { scroll: false });
}
