"use client";

import HubAgentPanel from "@/features/hubAgents/HubAgentPanel";
import { useBillingHubAgentBridgeOptional } from "@/context/BillingHubAgentBridgeContext";
import { useBillingHubAgent } from "@/features/billingHub/hooks/useBillingHubAgent";
import type { BillingHubMetrics } from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions/types";

type Props = {
  companyId: string;
  interventions: Intervention[];
  metrics: BillingHubMetrics;
  loading?: boolean;
  pageActive?: boolean;
};

export default function BillingHubAgentPanel({
  companyId,
  interventions,
  metrics,
  loading = false,
  pageActive = true,
}: Props) {
  const bridge = useBillingHubAgentBridgeOptional();
  const agent = useBillingHubAgent({
    companyId,
    interventions,
    metrics,
    enabled: Boolean(companyId) && pageActive,
  });

  return (
    <HubAgentPanel
      testIdPrefix="billing-hub-agent"
      thinkingLabelKey="billingHub.agent_thinking"
      agent={agent}
      loading={loading}
      pageActive={pageActive}
      enabled={Boolean(companyId)}
      registerHandlers={bridge?.registerHandlers ?? (() => {})}
    />
  );
}
