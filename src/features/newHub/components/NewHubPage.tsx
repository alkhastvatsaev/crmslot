"use client";

import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import { NEW_HUB_SLOT_INDEX } from "@/features/newHub/newHubConstants";
import { DASHBOARD_DESKTOP_PANEL_GAP_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = { slotIndex?: number };

const railShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-4 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Page 8 carrousel — nouvelle fonctionnalité (rails libres). */
export default function NewHubPage({ slotIndex = NEW_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();

  return (
    <DashboardTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("newHub.aria.page")} ${humanPage} — ${t("newHub.aria.left")}`}
      centerAriaLabel={`${t("newHub.aria.page")} ${humanPage} — ${t("newHub.aria.center")}`}
      rightAriaLabel={`${t("newHub.aria.page")} ${humanPage} — ${t("newHub.aria.right")}`}
      left={
        <section className={railShell}>
          <div data-testid="new-hub-panel-left" className="flex min-h-0 flex-1 flex-col" />
        </section>
      }
      center={
        <section className={railShell}>
          <div data-testid="new-hub-panel-center" className="flex min-h-0 flex-1 flex-col" />
        </section>
      }
      right={
        <section className={railShell}>
          <div data-testid="new-hub-panel-right" className="flex min-h-0 flex-1 flex-col" />
        </section>
      }
    />
  );
}
