"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HUB_SURFACE, HubSegmentedControl } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import ChatbotDocumentsRightPanel from "@/features/chatbot/components/ChatbotDocumentsRightPanel";
import BillingHubRightAssistPanel from "@/features/billingHub/components/BillingHubRightAssistPanel";
import type { Intervention } from "@/features/interventions";

type BillingHubRightTab = "documents" | "dossier";

type Props = {
  interventions: Intervention[];
  loading: boolean;
};

/** Panneau droit hub facturation — onglets Documents / Dossier (même pattern que l'inbox back-office). */
export default function BillingHubRightPanel({ interventions, loading }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<BillingHubRightTab>("documents");

  return (
    <div
      data-testid="billing-hub-right-panel"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]",
        HUB_SURFACE.muted
      )}
    >
      <HubSegmentedControl
        value={activeTab}
        onChange={(id) => setActiveTab(id as BillingHubRightTab)}
        ariaLabel={String(t("billingHub.right_tabs.aria"))}
        className="mx-4 my-4 shrink-0"
        options={[
          {
            id: "documents",
            label: t("billingHub.right_tabs.documents"),
            testId: "billing-hub-right-tab-documents",
            activeAccent: "slate",
          },
          {
            id: "dossier",
            label: t("billingHub.right_tabs.dossier"),
            testId: "billing-hub-right-tab-dossier",
            activeAccent: "blue",
          },
        ]}
      />

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          activeTab !== "documents" && "hidden"
        )}
        aria-hidden={activeTab !== "documents"}
        data-testid="billing-hub-documents-panel"
      >
        <ChatbotDocumentsRightPanel />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4",
          activeTab !== "dossier" && "hidden"
        )}
        aria-hidden={activeTab !== "dossier"}
        data-testid="billing-hub-dossier-panel"
      >
        <BillingHubRightAssistPanel interventions={interventions} loading={loading} />
      </div>
    </div>
  );
}
