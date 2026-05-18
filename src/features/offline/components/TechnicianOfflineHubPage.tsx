"use client";

import { useState } from "react";
import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import BackOfficeHubPanelShell from "@/features/backoffice/components/BackOfficeHubPanelShell";
import PwaCopilotChatPanel from "@/features/copilot/components/PwaCopilotChatPanel";
import PwaCopilotContextSummary from "@/features/copilot/components/PwaCopilotContextSummary";
import PwaCopilotSuggestions from "@/features/copilot/components/PwaCopilotSuggestions";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot/hooks/useWorkspaceCopilotSnapshot";
import { DASHBOARD_DESKTOP_PANEL_GAP_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = { slotIndex: number };

const railShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-4 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Page 5 — assistant IA connecté au contexte PWA (dossiers, clients, facturation). */
export default function TechnicianOfflineHubPage({ slotIndex }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const { snapshot, loading } = useWorkspaceCopilotSnapshot();
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  return (
    <DashboardTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      centerPadding={false}
      leftAriaLabel={`${t("copilot.aria.page")} ${humanPage} — ${t("copilot.panel_context")}`}
      centerAriaLabel={`${t("copilot.aria.page")} ${humanPage} — ${t("copilot.panel_chat")}`}
      rightAriaLabel={`${t("copilot.aria.page")} ${humanPage} — ${t("copilot.panel_suggestions")}`}
      left={
        <section className={railShell} data-testid="pwa-copilot-rail-left">
          <BackOfficeHubPanelShell title={t("copilot.panel_context")} testId="pwa-copilot-panel-context">
            <PwaCopilotContextSummary snapshot={snapshot} loading={loading} />
          </BackOfficeHubPanelShell>
        </section>
      }
      center={
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden" data-testid="pwa-copilot-rail-center">
          <PwaCopilotChatPanel
            snapshot={snapshot}
            loadingSnapshot={loading}
            externalPrompt={externalPrompt}
            onExternalPromptConsumed={() => setExternalPrompt(null)}
          />
        </section>
      }
      right={
        <section className={railShell} data-testid="pwa-copilot-rail-right">
          <BackOfficeHubPanelShell title={t("copilot.panel_suggestions")} testId="pwa-copilot-panel-suggestions">
            <PwaCopilotSuggestions
              disabled={!snapshot || loading}
              onPick={(prompt) => setExternalPrompt(prompt)}
            />
          </BackOfficeHubPanelShell>
        </section>
      }
    />
  );
}
