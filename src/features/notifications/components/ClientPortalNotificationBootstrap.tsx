"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useRequesterHub } from "@/context/RequesterHubContext";
import {
  applyClientNotificationIntent,
  CLIENT_NOTIFICATION_INTENT_EVENT,
  parseClientNotificationSearchParams,
} from "@/features/notifications/clientNotificationIntent";
import type { ClientNotificationIntent } from "@/features/notifications/clientNotificationUrls";

/** Traite `bmClientCase` / `bmClientChat` (URL ou clic notif native / Web Push). */
export default function ClientPortalNotificationBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();
  const { setLastSubmittedInterventionId, setPendingTrackingInterventionId, setPortalRightTab } =
    useRequesterHub();

  const handleIntent = useCallback(
    (intent: ClientNotificationIntent, fromUrl: boolean) => {
      applyClientNotificationIntent(intent, {
        pathname,
        pager,
        setLastSubmittedInterventionId,
        setPendingTrackingInterventionId,
        setPortalRightTab,
        router,
        searchParams: fromUrl ? searchParams : undefined,
      });
    },
    [
      pathname,
      pager,
      router,
      searchParams,
      setLastSubmittedInterventionId,
      setPendingTrackingInterventionId,
      setPortalRightTab,
    ]
  );

  useEffect(() => {
    const intent = parseClientNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;
    handleIntent(intent, true);
  }, [searchParams, handleIntent]);

  useEffect(() => {
    const onIntent = (event: Event) => {
      const intent = (event as CustomEvent<ClientNotificationIntent>).detail;
      if (!intent || intent.kind === "none") return;
      handleIntent(intent, false);
    };
    window.addEventListener(CLIENT_NOTIFICATION_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(CLIENT_NOTIFICATION_INTENT_EVENT, onIntent);
  }, [handleIntent]);

  return null;
}
