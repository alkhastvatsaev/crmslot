"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import type { Intervention } from "@/features/interventions/types";
import InterventionCaseTimeline from "@/features/interventions/components/InterventionCaseTimeline";
import InterventionEmailPanel from "@/features/emails/components/InterventionEmailPanel";
import InterventionMaterialOrdersPanel from "@/features/materials/components/InterventionMaterialOrdersPanel";
import InterventionCommissionPanel from "@/features/commissions/components/InterventionCommissionPanel";
import InterventionInvoiceAmountField from "@/features/commissions/components/InterventionInvoiceAmountField";
import InvoiceBillingPanel from "@/features/billing/components/InvoiceBillingPanel";
import InterventionClientLinkPanel from "@/features/clients/components/InterventionClientLinkPanel";

export type UnifiedDrawerTab = "timeline" | "emails" | "materials" | "billing" | "crm";

type Props = {
  intervention: Intervention;
  technicianUid: string;
  allowMaterialCreate?: boolean;
  allowMaterialStatusUpdate?: boolean;
  defaultTab?: UnifiedDrawerTab;
  className?: string;
};

const BASE_TABS: UnifiedDrawerTab[] = ["timeline", "emails", "materials", "billing", "crm"];

export default function UnifiedInterventionDrawer({
  intervention,
  technicianUid,
  allowMaterialCreate = false,
  allowMaterialStatusUpdate = false,
  defaultTab = "timeline",
  className,
}: Props) {
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const tabs = useMemo(
    () => (crmEnabled ? BASE_TABS : BASE_TABS.filter((id) => id !== "crm")),
    [crmEnabled],
  );
  const safeDefault = tabs.includes(defaultTab) ? defaultTab : "timeline";
  const [tab, setTab] = useState<UnifiedDrawerTab>(safeDefault);

  const labelKey: Record<UnifiedDrawerTab, string> = {
    timeline: "intervention_drawer.tab_timeline",
    emails: "intervention_drawer.tab_emails",
    materials: "intervention_drawer.tab_materials",
    billing: "intervention_drawer.tab_billing",
    crm: "intervention_drawer.tab_crm",
  };

  return (
    <section
      data-testid="unified-intervention-drawer"
      className={cn("rounded-[20px] border border-slate-100 bg-slate-50/40", className)}
    >
      <div
        className="flex gap-1 overflow-x-auto border-b border-slate-100 p-2"
        role="tablist"
        data-testid="unified-intervention-drawer-tabs"
      >
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            data-testid={`unified-drawer-tab-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition",
              tab === id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100",
            )}
          >
            {t(labelKey[id])}
          </button>
        ))}
      </div>
      <div className="p-4" data-testid={`unified-drawer-panel-${tab}`}>
        {tab === "timeline" ? (
          <InterventionCaseTimeline
            interventionId={intervention.id}
            companyId={intervention.companyId ?? null}
            className="min-h-[240px]"
          />
        ) : null}
        {tab === "emails" ? (
          <InterventionEmailPanel
            interventionId={intervention.id}
            companyId={intervention.companyId ?? null}
          />
        ) : null}
        {tab === "materials" ? (
          <InterventionMaterialOrdersPanel
            intervention={intervention}
            technicianUid={technicianUid}
            allowCreate={allowMaterialCreate}
            allowStatusUpdate={allowMaterialStatusUpdate}
          />
        ) : null}
        {tab === "billing" ? (
          <div className="space-y-4">
            <InterventionInvoiceAmountField intervention={intervention} />
            <InvoiceBillingPanel intervention={intervention} />
            <InterventionCommissionPanel intervention={intervention} />
          </div>
        ) : null}
        {tab === "crm" ? <InterventionClientLinkPanel intervention={intervention} /> : null}
      </div>
    </section>
  );
}
