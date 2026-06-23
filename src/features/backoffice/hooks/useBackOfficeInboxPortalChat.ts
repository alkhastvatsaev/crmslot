"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";
import { IVANA_PORTAL_MESSAGE_EVENT } from "@/features/backoffice/ivanaChatPortalBridge";
import { subscribeIvanaPortalMessages } from "@/features/backoffice/ivanaChatFirestore";
import type { IvanaPortalChatDoc } from "@/features/backoffice/ivanaChatFirestore";
import {
  countClientPortalThreadsNeedingReply,
  filterNewClientPortalMessages,
  interventionIdsWithClientPortalChat,
  showPortalChatBrowserNotification,
} from "@/features/backoffice/portalChatInboxLogic";
import { buildChatDayRows } from "@/features/backoffice/chatDayMissionRow";
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
  ivanaChatCompanyId: string | null;
  setActiveTab: (tab: BackOfficeInboxTab) => void;
  setSelectedChatInterventionId: (id: string | null) => void;
  chatTabLabel: string;
};

export function useBackOfficeInboxPortalChat({
  dayMissions,
  interventions,
  selectedDate,
  workspace,
  inboxLive,
  isTenant,
  ivanaChatCompanyId,
  setActiveTab,
  setSelectedChatInterventionId,
  chatTabLabel,
}: PortalChatArgs) {
  const portalChatHydratedRef = useRef(false);
  const [portalChatMessages, setPortalChatMessages] = useState<IvanaPortalChatDoc[]>([]);

  const chatDayRows = useMemo(
    () =>
      buildChatDayRows({
        interventions,
        dayMissions,
        selectedDate,
        workspace,
        includeInterventionIds: interventionIdsWithClientPortalChat(portalChatMessages),
      }),
    [dayMissions, interventions, selectedDate, workspace, portalChatMessages]
  );

  const chatThreadsNeedingReply = useMemo(
    () => countClientPortalThreadsNeedingReply(portalChatMessages),
    [portalChatMessages]
  );

  useEffect(() => {
    if (!isTenant) return;
    const openChat = () => setActiveTab("chat");
    window.addEventListener(IVANA_PORTAL_MESSAGE_EVENT, openChat);
    return () => window.removeEventListener(IVANA_PORTAL_MESSAGE_EVENT, openChat);
  }, [isTenant, setActiveTab]);

  useEffect(() => {
    if (!inboxLive || !isConfigured || !firestore || !ivanaChatCompanyId || !isTenant) return;

    portalChatHydratedRef.current = false;
    const seen = new Set<string>();
    return subscribeIvanaPortalMessages(
      firestore,
      ivanaChatCompanyId,
      (rows) => {
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
        const ivId = incoming[incoming.length - 1]?.interventionId?.trim();
        setSelectedChatInterventionId(ivId || "global");

        const preview = incoming[incoming.length - 1]?.body?.trim() || "Nouveau message client";
        showPortalChatBrowserNotification(chatTabLabel, preview, `portal-chat-${ivId || "global"}`);
      },
      (err) => {
        logger.error("[useBackOfficeInboxPortalChat] portal chat watch", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    );
  }, [
    chatTabLabel,
    inboxLive,
    ivanaChatCompanyId,
    isTenant,
    setActiveTab,
    setSelectedChatInterventionId,
  ]);

  return { chatDayRows, chatThreadsNeedingReply };
}
