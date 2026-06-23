"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import {
  applyBackofficeChatNotificationIntent,
  BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/backofficeChatNotificationIntent";
import {
  parseBackofficeChatNotificationSearchParams,
  type BackofficeChatNotificationIntent,
} from "@/features/notifications/backofficeChatNotificationUrls";

/** Traite `bmBackofficeChat` après clic push message client portail. */
export default function BackofficeChatNotificationBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();

  const handleIntent = useCallback(
    (intent: BackofficeChatNotificationIntent, fromUrl: boolean) => {
      if (!inboxIntent) return;
      applyBackofficeChatNotificationIntent(intent, {
        pager,
        setPendingChatInterventionId: inboxIntent.setPendingChatInterventionId,
        router,
        searchParams: fromUrl ? searchParams : undefined,
      });
    },
    [inboxIntent, pager, router, searchParams]
  );

  useEffect(() => {
    const intent = parseBackofficeChatNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;
    handleIntent(intent, true);
  }, [searchParams, handleIntent]);

  useEffect(() => {
    const onIntent = (event: Event) => {
      const intent = (event as CustomEvent<BackofficeChatNotificationIntent>).detail;
      if (!intent || intent.kind === "none") return;
      handleIntent(intent, false);
    };
    window.addEventListener(BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT, onIntent);
  }, [handleIntent]);

  return null;
}
