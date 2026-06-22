"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";
import {
  navigateCompanyHub,
  COMPANY_HUB_ANCHOR_CLIENT_PORTAL,
} from "@/features/company/companyHubNavigation";
import {
  BM_CLIENT_CASE_PARAM,
  BM_CLIENT_CHAT_PARAM,
} from "@/features/notifications/notificationConstants";
import { parseClientNotificationSearchParams } from "@/features/notifications/clientNotificationUrls";

/** Traite `bmClientCase` / `bmClientChat` après clic sur une notification push portail client. */
export default function ClientPortalNotificationBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();
  const { setLastSubmittedInterventionId, setPendingTrackingInterventionId, setPortalRightTab } =
    useRequesterHub();

  useEffect(() => {
    const intent = parseClientNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;

    if (intent.kind === "chat") {
      if (intent.caseId) {
        setLastSubmittedInterventionId(intent.caseId);
        setPendingTrackingInterventionId(intent.caseId);
      }
      setPortalRightTab("chat");
    } else {
      navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_CLIENT_PORTAL);
      setLastSubmittedInterventionId(intent.caseId);
      setPendingTrackingInterventionId(intent.caseId);
      setPortalRightTab("tracking");
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete(BM_CLIENT_CASE_PARAM);
    next.delete(BM_CLIENT_CHAT_PARAM);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [
    searchParams,
    router,
    pager,
    setLastSubmittedInterventionId,
    setPendingTrackingInterventionId,
    setPortalRightTab,
  ]);

  return null;
}
