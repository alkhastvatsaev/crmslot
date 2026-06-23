"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTechnicianCaseIntent } from "@/context/TechnicianCaseIntentContext";
import { useDashboardPagerOptional } from "@/features/dashboard";
import {
  applyTechnicianNotificationIntent,
  parseTechnicianNotificationSearchParams,
  TECHNICIAN_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/technicianNotificationIntent";
import type { TechnicianNotificationIntent } from "@/features/notifications/technicianNotificationUrls";

/** Traite `bmTechCase` / `bmTechReminder` (URL ou clic notif native Capacitor). */
export default function TechnicianNotificationBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();
  const { setPendingCaseId } = useTechnicianCaseIntent();

  const handleIntent = useCallback(
    (intent: TechnicianNotificationIntent, fromUrl: boolean) => {
      applyTechnicianNotificationIntent(intent, {
        pathname,
        pager,
        setPendingCaseId,
        router,
        searchParams: fromUrl ? searchParams : undefined,
      });
    },
    [pathname, pager, router, searchParams, setPendingCaseId]
  );

  useEffect(() => {
    const intent = parseTechnicianNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;
    handleIntent(intent, true);
  }, [searchParams, handleIntent]);

  useEffect(() => {
    const onNativeIntent = (event: Event) => {
      const intent = (event as CustomEvent<TechnicianNotificationIntent>).detail;
      if (!intent || intent.kind === "none") return;
      handleIntent(intent, false);
    };
    window.addEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, onNativeIntent);
    return () => window.removeEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, onNativeIntent);
  }, [handleIntent]);

  return null;
}
