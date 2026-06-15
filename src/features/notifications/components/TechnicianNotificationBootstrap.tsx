"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTechnicianCaseIntent } from "@/context/TechnicianCaseIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import {
  BM_TECH_CASE_PARAM,
  BM_TECH_REMINDER_PARAM,
} from "@/features/notifications/notificationConstants";
import { parseTechnicianNotificationSearchParams } from "@/features/notifications/technicianNotificationUrls";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";

/** Traite `bmTechCase` / `bmTechReminder` après clic sur une notification push (service worker). */
export default function TechnicianNotificationBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();
  const { setPendingCaseId } = useTechnicianCaseIntent();

  useEffect(() => {
    const intent = parseTechnicianNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;

    navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_MISSIONS, { pathname });

    if (intent.kind === "case") {
      setPendingCaseId(intent.caseId);
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete(BM_TECH_CASE_PARAM);
    next.delete(BM_TECH_REMINDER_PARAM);
    const qs = next.toString();

    const basePath = pathname.startsWith(TECHNICIAN_MOBILE_APP_ROUTE)
      ? TECHNICIAN_MOBILE_APP_ROUTE
      : "/";
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }, [searchParams, router, pathname, pager, setPendingCaseId]);

  return null;
}
