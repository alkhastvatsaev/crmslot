"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { HUB_SURFACE, HubSegmentedControl } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useBillingHubIntent } from "@/context/BillingHubIntentContext";
import ChatbotRightRail from "@/features/chatbot/components/ChatbotRightRail";
import BillingSurchargeSettingsPanel from "@/features/billingHub/components/BillingSurchargeSettingsPanel";
import type { BillingHubRightPanelTab } from "@/context/BillingHubIntentContext";

type Props = {
  companyId: string | null;
  isAdmin: boolean;
};

/** Panneau droit hub facturation — Documents PDF + réglages majorations. */
export default function BillingHubRightPanel({ companyId, isAdmin }: Props) {
  const { t } = useTranslation();
  const { rightPanelTab, setRightPanelTab } = useBillingHubIntent();
  const [activeTab, setActiveTab] = useState<BillingHubRightPanelTab>(rightPanelTab);

  useEffect(() => {
    setActiveTab(rightPanelTab);
  }, [rightPanelTab]);

  const pickTab = (id: string) => {
    const tab = id as BillingHubRightPanelTab;
    setActiveTab(tab);
    setRightPanelTab(tab);
  };

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
        onChange={pickTab}
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
            id: "surcharges",
            label: t("billingHub.right_tabs.surcharges"),
            testId: "billing-hub-right-tab-surcharges",
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
        <ChatbotRightRail />
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4",
          activeTab !== "surcharges" && "hidden"
        )}
        aria-hidden={activeTab !== "surcharges"}
        data-testid="billing-hub-surcharges-panel"
      >
        <BillingSurchargeSettingsPanel companyId={companyId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
