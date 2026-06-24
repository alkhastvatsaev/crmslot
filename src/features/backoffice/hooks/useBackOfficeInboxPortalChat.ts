"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";
import { PORTAL_CHAT_MESSAGE_EVENT } from "@/features/backoffice/portalChatBridge";
import { subscribePortalChatMessages } from "@/features/backoffice/portalChatFirestore";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import {
  countClientPortalThreadsNeedingReply,
  enrichChatDayRowsFromPortalMessages,
  filterNewClientPortalMessages,
  portalChatMessageTimeMs,
  portalChatPickerThreadId,
  PORTAL_CHAT_GLOBAL_THREAD_ID,
  showPortalChatBrowserNotification,
} from "@/features/backoffice/portalChatInboxLogic";
import type { BackOfficeInboxTab } from "@/features/backoffice/backOfficeInboxTypes";
import type { Mission } from "@/features/map";
import type { Intervention } from "@/features/interventions";

type PortalChatArgs = {
  dayMissions?: Mission[];
  interventions: Intervention[];
  selectedDate: Date;
  workspace: CompanyWorkspaceApi | null;
  inboxLive: boolean;
  isTenant: boolean;
  inboxCompanyIds: string[];
  setActiveTab: (tab: BackOfficeInboxTab) => void;
  setSelectedChatInterventionId: (id: string | null) => void;
  chatTabLabel: string;
};

function mergePortalChatRows(rowsByCompany: Iterable<PortalChatDoc[]>): PortalChatDoc[] {
  const byId = new Map<string, PortalChatDoc>();
  for (const rows of rowsByCompany) {
    for (const row of rows) byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) => portalChatMessageTimeMs(a) - portalChatMessageTimeMs(b));
}

export function useBackOfficeInboxPortalChat({
  dayMissions,
  interventions,
  selectedDate,
  workspace,
  inboxLive,
  isTenant,
  inboxCompanyIds,
  setActiveTab,
  setSelectedChatInterventionId,
  chatTabLabel,
}: PortalChatArgs) {
  const portalChatHydratedRef = useRef(false);
  const [portalChatMessages, setPortalChatMessages] = useState<PortalChatDoc[]>([]);

  const chatDayRows = useMemo(
    () =>
      enrichChatDayRowsFromPortalMessages([], portalChatMessages, {
        interventions,
        selectedDate,
      }),
    [interventions, selectedDate, portalChatMessages]
  );

  const chatThreadsNeedingReply = useMemo(
    () => countClientPortalThreadsNeedingReply(portalChatMessages),
    [portalChatMessages]
  );

  useEffect(() => {
    if (!isTenant) return;
    const openChat = () => setActiveTab("chat");
    window.addEventListener(PORTAL_CHAT_MESSAGE_EVENT, openChat);
    return () => window.removeEventListener(PORTAL_CHAT_MESSAGE_EVENT, openChat);
  }, [isTenant, setActiveTab]);

  useEffect(() => {
    const companyIds = inboxCompanyIds.map((id) => id.trim()).filter(Boolean);
    const chatDb = firestore;
    if (!inboxLive || !isConfigured || !chatDb || companyIds.length === 0 || !isTenant) return;

    portalChatHydratedRef.current = false;
    const seen = new Set<string>();
    const rowsByCompany = new Map<string, PortalChatDoc[]>();

    const publishMerged = () => {
      const rows = mergePortalChatRows(rowsByCompany.values());
      setPortalChatMessages(rows);
      if (!portalChatHydratedRef.current) {
        portalChatHydratedRef.current = true;
        rows.forEach((r) => seen.add(r.id));
        return;
      }

      const uid = auth?.currentUser?.uid;
      const incoming = filterNewClientPortalMessages(rows, seen, uid);
      incoming.forEach((r) => seen.add(r.id));
      if (incoming.length === 0) return;

      setActiveTab("chat");
      const lastIncoming = incoming[incoming.length - 1];
      const threadId = lastIncoming
        ? portalChatPickerThreadId(lastIncoming)
        : PORTAL_CHAT_GLOBAL_THREAD_ID;
      setSelectedChatInterventionId(threadId);
      const preview = lastIncoming?.body?.trim() || "Nouveau message client";
      showPortalChatBrowserNotification(chatTabLabel, preview, `portal-chat-${threadId}`);
    };

    const unsubs = companyIds.map((companyId) =>
      subscribePortalChatMessages(
        chatDb,
        companyId,
        (rows) => {
          rowsByCompany.set(companyId, rows);
          publishMerged();
        },
        (err) => {
          logger.error("[useBackOfficeInboxPortalChat] portal chat watch", {
            companyId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      )
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [
    chatTabLabel,
    inboxCompanyIds,
    inboxLive,
    isTenant,
    setActiveTab,
    setSelectedChatInterventionId,
  ]);

  return { chatDayRows, chatThreadsNeedingReply };
}
