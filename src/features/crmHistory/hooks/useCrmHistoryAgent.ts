"use client";

import { useMemo } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { useHubAgent } from "@/features/hubAgents/useHubAgent";
import { isCrmHistoryAgentInScope } from "@/features/crmHistory/crmHistoryAgentScope";
import { buildCrmHistoryActivitySnapshot } from "@/features/crmHistory/crmHistoryAgentSnapshot";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

const STORAGE_KEY = "belmap-crm-history-agent-v1";

type Options = {
  companyId: string;
  events: CrmActivityEvent[];
  enabled?: boolean;
};

export function useCrmHistoryAgent({ companyId, events, enabled = true }: Options) {
  const { t } = useTranslation();

  const activitySnapshot = useMemo(() => buildCrmHistoryActivitySnapshot(events), [events]);

  const onStreamEvent = useHubAgentStreamHandler();

  const offTopicSuggestions = useMemo(
    () => [
      String(t("crmHistory.ai.shortcuts.summary_week")),
      String(t("crmHistory.ai.shortcuts.materials_ordered")),
      String(t("crmHistory.ai.shortcuts.unresolved")),
    ],
    [t],
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
    }),
    onStreamEvent,
  });
}
