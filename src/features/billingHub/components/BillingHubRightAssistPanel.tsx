"use client";

import { useMemo } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useBillingHubIntent } from "@/context/BillingHubIntentContext";
import { navigateToBillingAgentWithPrompt } from "@/features/featureHub/companyStockChatbot";
import InvoiceBillingPanel from "@/features/billing/components/InvoiceBillingPanel";
import type { Intervention } from "@/features/interventions/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  interventions: Intervention[];
  loading: boolean;
};

export default function BillingHubRightAssistPanel({ interventions, loading }: Props) {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const { selectedInterventionId } = useBillingHubIntent();

  const selected = useMemo(
    () => interventions.find((iv) => iv.id === selectedInterventionId) ?? null,
    [interventions, selectedInterventionId],
  );

  if (loading) {
    return (
      <div
        data-testid="billing-hub-right-assist"
        className="flex min-h-0 flex-1 items-center justify-center"
        style={outfit}
      >
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div
      data-testid="billing-hub-right-assist"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
      style={outfit}
    >
      {selected ? (
        <>
          <InvoiceBillingPanel intervention={selected} />
          <button
            type="button"
            data-testid="billing-hub-ask-chatbot"
            aria-label={t("billingHub.ask_chatbot")}
            onClick={() => {
              navigateToBillingAgentWithPrompt(
                pager,
                `Facturation intervention ${selected.id} — ${selected.clientName ?? ""}. Résume HT/TTC et propose les prochaines actions.`,
                "send",
              );
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-slate-900 py-2.5 text-[12px] font-semibold text-white hover:bg-slate-800"
          >
            <Bot className="h-4 w-4" />
            {t("billingHub.ask_chatbot")}
          </button>
        </>
      ) : (
        <p className="py-8 text-center text-[11px] text-slate-400">—</p>
      )}
    </div>
  );
}
