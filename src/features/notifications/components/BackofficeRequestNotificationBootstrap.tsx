"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import {
  applyBackofficeRequestNotificationIntent,
  BACKOFFICE_REQUEST_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/backofficeRequestNotificationIntent";
import {
  parseBackofficeRequestNotificationSearchParams,
  type BackofficeRequestNotificationIntent,
} from "@/features/notifications/backofficeRequestNotificationUrls";

/** Traite `bmBackofficeRequest` après clic push nouvelle demande client. */
export default function BackofficeRequestNotificationBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();

  const handleIntent = useCallback(
    (intent: BackofficeRequestNotificationIntent, fromUrl: boolean) => {
      if (!inboxIntent) return;
      applyBackofficeRequestNotificationIntent(intent, {
        pager,
        setPendingInboxId: inboxIntent.setPendingInboxId,
        router,
        searchParams: fromUrl ? searchParams : undefined,
      });
    },
    [inboxIntent, pager, router, searchParams]
  );

  useEffect(() => {
    const intent = parseBackofficeRequestNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;
    handleIntent(intent, true);
  }, [searchParams, handleIntent]);

  useEffect(() => {
    const onIntent = (event: Event) => {
      const intent = (event as CustomEvent<BackofficeRequestNotificationIntent>).detail;
      if (!intent || intent.kind === "none") return;
      handleIntent(intent, false);
    };
    window.addEventListener(BACKOFFICE_REQUEST_NOTIFICATION_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(BACKOFFICE_REQUEST_NOTIFICATION_INTENT_EVENT, onIntent);
  }, [handleIntent]);

  return null;
}
