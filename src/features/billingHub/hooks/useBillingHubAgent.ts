"use client";

import { useCallback, useMemo } from "react";
import { useBillingHubIntentOptional } from "@/context/BillingHubIntentContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useHubAgentStreamHandler } from "@/features/hubAgents/handleHubAgentStreamEvent";
import { useHubAgent } from "@/features/hubAgents/useHubAgent";
import { isBillingHubAgentInScope } from "@/features/billingHub/billingHubAgentScope";
import { buildBillingHubSnapshot } from "@/features/billingHub/billingHubAgentSnapshot";
import { downloadAccountingCsv } from "@/features/billing/exportAccountingCsv";
import { downloadPayrollCsv } from "@/features/timetracking/exportPayrollCsv";
import { useTimeEntries } from "@/features/timetracking/hooks/useTimeEntries";
import { auth } from "@/core/config/firebase";
import type { BillingHubMetrics } from "@/features/billingHub/billingHubMetrics";
import type { Intervention } from "@/features/interventions";

const STORAGE_KEY = "crmslot-billing-hub-agent-v1";

type Options = {
  companyId: string;
  interventions: Intervention[];
  metrics: BillingHubMetrics;
  enabled?: boolean;
};

export function useBillingHubAgent({ companyId, interventions, metrics, enabled = true }: Options) {
  const { t } = useTranslation();
  const billingIntent = useBillingHubIntentOptional();

  const billingSnapshot = useMemo(
    () => buildBillingHubSnapshot(interventions, metrics),
    [interventions, metrics]
  );

  const focusInterventionId = billingIntent?.selectedInterventionId ?? null;

  const uid = auth?.currentUser?.uid?.trim() ?? "";
  const timeEntries = useTimeEntries(uid || null);

  const onExportAccountingCsv = useCallback(() => {
    const period = new Date().toISOString().slice(0, 7);
    downloadAccountingCsv(interventions, `export-comptable-${period}.csv`);
  }, [interventions]);

  const onExportPayrollCsv = useCallback(() => {
    downloadPayrollCsv(timeEntries);
  }, [timeEntries]);

  const onStreamEvent = useHubAgentStreamHandler({
    documentPreviewTarget: "right",
    billingDocumentOnBillingPage: true,
    companyId,
    onExportAccountingCsv,
    onExportPayrollCsv,
  });

  const offTopicSuggestions = useMemo(
    () => [
      String(t("billingHub.agent_suggestion_unpaid")),
      String(t("billingHub.agent_suggestion_to_bill")),
    ],
    [t]
  );

  return useHubAgent({
    storageKey: STORAGE_KEY,
    apiPath: "/api/ai/billing-hub-agent",
    idPrefix: "bill",
    companyId,
    enabled,
    isInScope: isBillingHubAgentInScope,
    offTopicText: String(t("billingHub.agent_off_topic")),
    offTopicSuggestions,
    buildRequestBody: ({ companyId: cid, companyName, role, messages }) => ({
      companyId: cid,
      companyName,
      role,
      messages,
      billingSnapshot,
      focusInterventionId,
    }),
    onStreamEvent,
  });
}
