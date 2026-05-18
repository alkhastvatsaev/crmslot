"use client";

import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import BackOfficeHubPanelShell from "@/features/backoffice/components/BackOfficeHubPanelShell";
import {
  BackOfficeHubExampleBilling,
  BackOfficeHubExampleEmails,
  BackOfficeHubExampleMaterials,
  BackOfficeHubExampleTimeline,
} from "@/features/backoffice/components/BackOfficeHubExampleRails";
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
import InterventionEmailPanel from "@/features/emails/components/InterventionEmailPanel";
import InterventionMaterialOrdersPanel from "@/features/materials/components/InterventionMaterialOrdersPanel";
import InterventionCommissionPanel from "@/features/commissions/components/InterventionCommissionPanel";
import InterventionInvoiceAmountField from "@/features/commissions/components/InterventionInvoiceAmountField";
import InvoiceBillingPanel from "@/features/billing/components/InvoiceBillingPanel";
import InterventionClientLinkPanel from "@/features/clients/components/InterventionClientLinkPanel";

type Props = { slotIndex: number };

const railShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-4 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Page 4 — Historique · Emails · Matériel / Facturation (3 panneaux vitrés). */
export default function BackOfficeHubPage({ slotIndex }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const crmEnabled = useFeatureFlag("crmContacts");
  const { intervention, isExample, technicianUid, allowMaterialCreate, companyId } =
    useBackOfficeHubSelectedIntervention();

  const exampleBadge = isExample ? t("backoffice.hub.example_badge") : undefined;

  return (
    <DashboardTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("backoffice.hub.aria.page")} ${humanPage} — ${t("intervention_drawer.tab_timeline")}`}
      centerAriaLabel={`${t("backoffice.hub.aria.page")} ${humanPage} — ${t("intervention_drawer.tab_emails")}`}
      rightAriaLabel={`${t("backoffice.hub.aria.page")} ${humanPage} — ${t("intervention_drawer.tab_materials")}`}
      left={
        <section id={BACKOFFICE_HUB_ANCHOR_DUPLICATES} className={railShell}>
          <BackOfficeHubPanelShell
            title={t("intervention_drawer.tab_timeline")}
            testId="backoffice-hub-panel-timeline"
            badge={exampleBadge}
          >
            {isExample ? (
              <BackOfficeHubExampleTimeline />
            ) : (
              <InterventionCaseTimeline
                interventionId={intervention.id}
                companyId={companyId}
                className="min-h-[240px] flex-1"
              />
            )}
          </BackOfficeHubPanelShell>
        </section>
      }
      center={
        <section id={BACKOFFICE_HUB_ANCHOR_DASHBOARD} className={railShell}>
          <BackOfficeHubPanelShell
            title={t("intervention_drawer.tab_emails")}
            testId="backoffice-hub-panel-emails"
            badge={exampleBadge}
          >
            {isExample ? (
              <BackOfficeHubExampleEmails />
            ) : (
              <InterventionEmailPanel interventionId={intervention.id} companyId={companyId} />
            )}
          </BackOfficeHubPanelShell>
        </section>
      }
      right={
        <section id={BACKOFFICE_HUB_ANCHOR_CALENDAR} className={railShell}>
          <BackOfficeHubPanelShell
            title={t("intervention_drawer.tab_materials")}
            testId="backoffice-hub-panel-materials"
            badge={exampleBadge}
            className="min-h-0 shrink-0"
          >
            {isExample ? (
              <BackOfficeHubExampleMaterials />
            ) : (
              <InterventionMaterialOrdersPanel
                intervention={intervention}
                technicianUid={technicianUid}
                allowCreate={allowMaterialCreate}
                allowStatusUpdate
              />
            )}
          </BackOfficeHubPanelShell>

          <BackOfficeHubPanelShell
            title={t("intervention_drawer.tab_billing")}
            testId="backoffice-hub-panel-billing"
            badge={exampleBadge}
            className="min-h-0 flex-1"
          >
            {isExample ? (
              <BackOfficeHubExampleBilling />
            ) : (
              <div className="space-y-4">
                <InterventionInvoiceAmountField intervention={intervention} />
                <InvoiceBillingPanel intervention={intervention} />
                <InterventionCommissionPanel intervention={intervention} />
              </div>
            )}
          </BackOfficeHubPanelShell>

          {crmEnabled && !isExample ? (
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
