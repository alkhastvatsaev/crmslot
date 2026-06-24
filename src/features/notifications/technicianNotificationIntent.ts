import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { DashboardPagerApi } from "@/features/dashboard";
import {
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
} from "@/features/notifications/notificationConstants";
import {
  currentAppPathname,
  isTechnicianAppPath,
  redirectToTechnicianApp,
} from "@/features/notifications/pushNotificationNavigation";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";
import {
  parseTechnicianNotificationSearchParams,
  type TechnicianNotificationIntent,
} from "@/features/notifications/technicianNotificationUrls";

export { parseTechnicianNotificationSearchParams };
export type { TechnicianNotificationIntent };

/** Événement DOM : clic notif Capacitor (useSearchParams ne suit pas replaceState). */
export const TECHNICIAN_NOTIFICATION_INTENT_EVENT = "crmslot:technician-notification-intent";

export function parseTechnicianNotificationData(
  data: Record<string, string | undefined>
): TechnicianNotificationIntent {
  const params = new URLSearchParams();
  const caseId = data[BM_TECH_CASE_PARAM]?.trim();
  const reminder = data[BM_TECH_REMINDER_PARAM]?.trim();
  if (caseId) params.set(BM_TECH_CASE_PARAM, caseId);
  if (reminder) params.set(BM_TECH_REMINDER_PARAM, reminder);

  const fromParams = parseTechnicianNotificationSearchParams(params);
  if (fromParams.kind !== "none") return fromParams;

  const pushType = data.type?.trim() ?? "";
  const interventionId = data.interventionId?.trim();
  if (
    interventionId &&
    (pushType === "assignment" ||
      pushType === "appointment_reminder" ||
      pushType === "unclosed_dossier")
  ) {
    return { kind: "case", caseId: interventionId };
  }
  if (pushType === "daily_reminder" || pushType === "appointment_reminder") {
    return { kind: "reminder" };
  }

  return { kind: "none" };
}

export function dispatchTechnicianNotificationIntent(intent: TechnicianNotificationIntent): void {
  if (typeof window === "undefined" || intent.kind === "none") return;

  if (!isTechnicianAppPath(currentAppPathname())) {
    const params = new URLSearchParams();
    if (intent.kind === "case") params.set(BM_TECH_CASE_PARAM, intent.caseId);
    if (intent.kind === "reminder") params.set(BM_TECH_REMINDER_PARAM, "1");
    redirectToTechnicianApp(params);
    return;
  }

  window.dispatchEvent(
    new CustomEvent<TechnicianNotificationIntent>(TECHNICIAN_NOTIFICATION_INTENT_EVENT, {
      detail: intent,
    })
  );
}

export function applyTechnicianNotificationIntent(
  intent: TechnicianNotificationIntent,
  ctx: {
    pathname: string;
    pager: DashboardPagerApi | null | undefined;
    setPendingCaseId: (id: string | null) => void;
    router: Pick<AppRouterInstance, "replace">;
    searchParams?: URLSearchParams;
  }
): void {
  if (intent.kind === "none") return;

  navigateTechnicianHub(ctx.pager, TECHNICIAN_HUB_ANCHOR_MISSIONS, { pathname: ctx.pathname });

  if (intent.kind === "case") {
    ctx.setPendingCaseId(intent.caseId);
  }

  if (!ctx.searchParams) return;

  const next = new URLSearchParams(ctx.searchParams.toString());
  next.delete(BM_TECH_CASE_PARAM);
  next.delete(BM_TECH_REMINDER_PARAM);
  const qs = next.toString();
  const basePath = ctx.pathname.startsWith(TECHNICIAN_MOBILE_APP_ROUTE)
    ? TECHNICIAN_MOBILE_APP_ROUTE
    : "/";
  const nextPath = qs ? `${basePath}?${qs}` : basePath;
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", nextPath);
  }
  ctx.router.replace(nextPath, { scroll: false });
}
