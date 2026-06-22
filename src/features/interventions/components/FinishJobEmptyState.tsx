"use client";

import { ClipboardList } from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { HubButton } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";

type Props = {
  pager: DashboardPagerApi | null | undefined;
};

export default function FinishJobEmptyState({ pager }: Props) {
  const { t } = useTranslation();

  return (
    <div data-testid="finish-job-empty" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-[260px] flex-col items-center justify-center gap-5 text-center`}
      >
        <p className="sr-only">{String(t("technician_hub.finish.no_mission"))}</p>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/80 shadow-inner">
          <ClipboardList className="h-8 w-8 text-slate-400" aria-hidden />
        </div>
        <p className="max-w-[200px] text-[14px] font-medium leading-relaxed text-slate-500">
          {String(t("technician_hub.finish.select_to_close"))}
        </p>
        <HubButton
          type="button"
          data-testid="finish-job-back-empty"
          onClick={() => navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_MISSIONS)}
          aria-label={String(t("technician_hub.finish.open_mission_list"))}
          className="mt-2"
        >
          {String(t("technician_hub.finish.see_missions"))}
        </HubButton>
      </div>
    </div>
  );
}
