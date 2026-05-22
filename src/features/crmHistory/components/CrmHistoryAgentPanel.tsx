"use client";

import HubAgentPanel from "@/features/hubAgents/HubAgentPanel";
import { useCrmHistoryAgentBridgeOptional } from "@/context/CrmHistoryAgentBridgeContext";
import { useCrmHistoryAgent } from "@/features/crmHistory/hooks/useCrmHistoryAgent";
import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";

type Props = {
  companyId: string;
  events: CrmActivityEvent[];
  loading?: boolean;
  pageActive?: boolean;
};

export default function CrmHistoryAgentPanel({
  companyId,
  events,
  loading = false,
  pageActive = true,
}: Props) {
  const bridge = useCrmHistoryAgentBridgeOptional();
  const agent = useCrmHistoryAgent({
    companyId,
    events,
    enabled: Boolean(companyId) && pageActive,
  });

  return (
    <HubAgentPanel
      testIdPrefix="crm-history-agent"
      thinkingLabelKey="crmHistory.agent_thinking"
      agent={agent}
      loading={loading}
      pageActive={pageActive}
      enabled={Boolean(companyId)}
      registerHandlers={bridge?.registerHandlers ?? (() => {})}
    />
  );
}
