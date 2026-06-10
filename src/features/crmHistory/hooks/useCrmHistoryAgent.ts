"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useDateContext } from "@/context/DateContext";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { useHubAgent } from "@/features/hubAgents/useHubAgent";
import { isCrmHistoryAgentInScope } from "@/features/crmHistory/crmHistoryAgentScope";
import {
  buildCrmHistoryActivitySnapshot,
  buildQmKpiSnapshot,
} from "@/features/crmHistory/crmHistoryAgentSnapshot";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

const STORAGE_KEY = "belmap-crm-history-agent-v1";

type Options = {
  companyId: string;
  events: CrmActivityEvent[];
  enabled?: boolean;
};

export function useCrmHistoryAgent({ companyId, events, enabled = true }: Options) {
  const { t } = useTranslation();
  const { selectedDate } = useDateContext();

  const dateLabel = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "aujourd'hui";
    return selectedDate.toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const activitySnapshot = useMemo(() => buildCrmHistoryActivitySnapshot(events), [events]);
  const kpiSnapshot = useMemo(() => buildQmKpiSnapshot(events, dateLabel), [events, dateLabel]);

  const onStreamEvent = useHubAgentStreamHandler();

  const offTopicSuggestions = useMemo(
    () => [
      String(t("crmHistory.ai.shortcuts.closure_rate")),
      String(t("crmHistory.ai.shortcuts.why_cancelled")),
      String(t("crmHistory.ai.shortcuts.tech_performance")),
    ],
    [t]
  );

  return useHubAgent({
    storageKey: STORAGE_KEY,
    apiPath: "/api/ai/crm-history-agent",
    idPrefix: "crm",
    companyId,
    enabled,
    isInScope: isCrmHistoryAgentInScope,
    offTopicText: String(t("crmHistory.agent_off_topic")),
    offTopicSuggestions,
    buildRequestBody: ({ companyId: cid, companyName, role, messages }) => ({
      companyId: cid,
      companyName,
      role,
      messages,
      activitySnapshot,
      kpiSnapshot,
    }),
    onStreamEvent,
  });
}
