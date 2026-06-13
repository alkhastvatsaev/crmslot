"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CrmPeriodFilter } from "../crmActivityTypes";
import { useDateContext } from "@/context/DateContext";
import { toast } from "sonner";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { navigateBackOfficeHub } from "@/features/backoffice/backofficeHubNavigation";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { CRM_HISTORY_SLOT_INDEX } from "../crmHistoryConstants";
import { useCrmActivityFeed } from "../hooks/useCrmActivityFeed";
import { useCrmNewEventHighlight } from "../hooks/useCrmNewEventHighlight";
import type { CrmActivityEvent } from "../crmActivityTypes";
import CrmHistoryAgentPanel from "./CrmHistoryAgentPanel";
import CrmHistoryCenterFeed from "./CrmHistoryCenterFeed";
import CrmHistoryEventDetailPanel from "./CrmHistoryEventDetailPanel";
import ClientsCrmPanel from "@/features/clients/components/ClientsCrmPanel";
import { useFeatureFlag } from "@/core/useFeatureFlags";

type Props = { slotIndex?: number };

const railShell = `flex min-h-0 flex-1 flex-col ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

export default function CrmHistoryPage({ slotIndex = CRM_HISTORY_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const companyId =
    (workspace?.activeCompanyId ?? "").trim() || (workspace?.isTenantUser ? DEMO_COMPANY_ID : null);

  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const pageActive = pager == null || pager.pageIndex === slotIndex;
  const crmContactsEnabled = useFeatureFlag("crmContacts");

  const { selectedDate } = useDateContext();
  const selectedDayKey = selectedDate.toLocaleDateString("en-CA");
  const { events, loading, refreshing, feedError } = useCrmActivityFeed(
    companyId,
    "all",
    "all",
    "",
    selectedDate
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedEventId(null);
  }, [selectedDayKey]);

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  const newEventIds = useCrmNewEventHighlight(events, { enabled: pageActive });
  const prevHighlightSizeRef = useRef(0);

  useEffect(() => {
    if (!pageActive) {
      prevHighlightSizeRef.current = 0;
      return;
    }
    if (newEventIds.size <= prevHighlightSizeRef.current) return;
    const delta = newEventIds.size - prevHighlightSizeRef.current;
    prevHighlightSizeRef.current = newEventIds.size;
    toast.message(String(t("crmHistory.new_activity_toast")), {
      description:
        delta === 1
          ? String(t("crmHistory.new_activity_one"))
          : String(t("crmHistory.new_activity_many")).replace("{count}", String(delta)),
      duration: 3500,
    });
  }, [newEventIds.size, pageActive, t]);

  const handleEventSelect = useCallback((event: CrmActivityEvent) => {
    setSelectedEventId(event.id);
  }, []);

  const handleOpenIntervention = useCallback(
    (event: CrmActivityEvent) => {
      if (!event.interventionId) return;
      inboxIntent?.setPendingInboxId(event.interventionId);
      navigateBackOfficeHub(pager);
    },
    [inboxIntent, pager]
  );

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("crmHistory.aria.page")} ${humanPage} — ${t("crmHistory.aria.left")}`}
      centerAriaLabel={`${t("crmHistory.aria.page")} ${humanPage} — ${t("crmHistory.aria.center")}`}
      rightAriaLabel={`${t("crmHistory.aria.page")} ${humanPage} — ${t("crmHistory.aria.right")}`}
      mobileLeftLabel={String(t("crmHistory.mobile.rail_agent"))}
      mobileCenterLabel={String(t("crmHistory.mobile.rail_feed"))}
      mobileRightLabel={String(t("crmHistory.mobile.rail_detail"))}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={railShell}>
          {companyId ? (
            <CrmHistoryAgentPanel
              companyId={companyId}
              events={events}
              loading={loading}
              pageActive={pageActive}
            />
          ) : null}
        </section>
      }
      center={
        <section className={`${railShell} overflow-hidden`}>
          <CrmHistoryCenterFeed
            events={events}
            loading={loading}
            refreshing={refreshing}
            live={pageActive}
            newEventIds={newEventIds}
            feedError={feedError}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
            selectedEvent={selectedEvent}
            onClearSelection={() => setSelectedEventId(null)}
            onOpenIntervention={handleOpenIntervention}
          />
        </section>
      }
      centerPadding={false}
      rightPadding={false}
      right={
        <section className={`${railShell} overflow-y-auto`}>
          <CrmHistoryEventDetailPanel event={null} allEvents={events} selectedDate={selectedDate} />
          {crmContactsEnabled ? (
            <div data-testid="crm-history-clients-rail" className="shrink-0">
              <ClientsCrmPanel />
            </div>
          ) : null}
        </section>
      }
    />
  );
}
