"use client";

import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import BackOfficeHubPanelShell from "@/features/backoffice/components/BackOfficeHubPanelShell";
import {
  BACKOFFICE_HUB_ANCHOR_CALENDAR,
  BACKOFFICE_HUB_ANCHOR_DASHBOARD,
  BACKOFFICE_HUB_ANCHOR_DUPLICATES,
} from "@/features/backoffice/backofficeHubNavigation";
import { useBackOfficeHubSelectedIntervention } from "@/features/backoffice/useBackOfficeHubSelectedIntervention";
import { DASHBOARD_DESKTOP_PANEL_GAP_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import InterventionCaseTimeline from "@/features/interventions/components/InterventionCaseTimeline";
import InterventionCommissionPanel from "@/features/commissions/components/InterventionCommissionPanel";
import InterventionInvoiceAmountField from "@/features/commissions/components/InterventionInvoiceAmountField";
import InvoiceBillingPanel from "@/features/billing/components/InvoiceBillingPanel";
import InterventionClientLinkPanel from "@/features/clients/components/InterventionClientLinkPanel";

type Props = { slotIndex: number };

const railShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-4 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

function EmptySelection({ message }: { message: string }) {
  return (
    <p className="text-sm text-slate-500" data-testid="backoffice-hub-empty-selection">
      {message}
    </p>
  );
}

/** Page 4 — Historique · Emails · Matériel / Facturation (3 panneaux vitrés). */
export default function BackOfficeHubPage({ slotIndex }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const { intervention, companyId } = useBackOfficeHubSelectedIntervention();

  const emptyMessage = "Sélectionnez une intervention dans l’inbox pour afficher le détail.";

  return (
    <DashboardTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("backoffice.hub.aria.page")} ${humanPage} — ${t("intervention_drawer.tab_timeline")}`}
      centerAriaLabel={`${t("backoffice.hub.aria.page")} ${humanPage} — ${t("backoffice.hub.aria.center_slot")}`}
      rightAriaLabel={`${t("backoffice.hub.aria.page")} ${humanPage} — ${t("intervention_drawer.tab_materials")}`}
      left={
        <section id={BACKOFFICE_HUB_ANCHOR_DUPLICATES} className={railShell}>
          <BackOfficeHubPanelShell
            title={t("intervention_drawer.tab_timeline")}
            testId="backoffice-hub-panel-timeline"
          >
            {intervention ? (
              <InterventionCaseTimeline
                interventionId={intervention.id}
                companyId={companyId}
                className="min-h-[240px] flex-1"
              />
            ) : (
              <EmptySelection message={emptyMessage} />
            )}
          </BackOfficeHubPanelShell>
        </section>
      }
      center={
        <section id={BACKOFFICE_HUB_ANCHOR_DASHBOARD} className={railShell}>
          <BackOfficeHubPanelShell testId="backoffice-hub-panel-center">
            {intervention ? null : <EmptySelection message={emptyMessage} />}
          </BackOfficeHubPanelShell>
        </section>
      }
      right={
        <section id={BACKOFFICE_HUB_ANCHOR_CALENDAR} className={railShell}>
          <BackOfficeHubPanelShell
            title={t("intervention_drawer.tab_billing")}
            testId="backoffice-hub-panel-billing"
            className="min-h-0 flex-1"
          >
            {intervention ? (
              <div className="space-y-4">
                <InterventionInvoiceAmountField intervention={intervention} />
                <InvoiceBillingPanel intervention={intervention} />
                <InterventionCommissionPanel intervention={intervention} />
              </div>
            ) : (
              <EmptySelection message={emptyMessage} />
            )}
          </BackOfficeHubPanelShell>

          {crmEnabled && intervention ? (
            <BackOfficeHubPanelShell
              title={t("intervention_drawer.tab_crm")}
              testId="backoffice-hub-panel-crm"
              className="min-h-0 shrink-0"
            >
              <InterventionClientLinkPanel intervention={intervention} />
            </BackOfficeHubPanelShell>
          ) : null}
        </section>
      }
    />
  );
}
