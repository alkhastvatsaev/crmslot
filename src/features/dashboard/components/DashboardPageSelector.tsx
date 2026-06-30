"use client";

import { useEffect } from "react";
import { getDashboardCarouselHubPages } from "@/features/dashboard/dashboardCarouselRegistry";
import {
  DASHBOARD_MOBILE_NAV_ICONS,
  MOBILE_TAB_I18N,
} from "@/features/dashboard/dashboardMobileNav";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import MobileCentralPanelFrame from "@/features/dashboard/components/MobileCentralPanelFrame";
import {
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
} from "@/core/ui/dashboardMobileLayout";
import {
  dashboardTripleCenterShellClass,
  DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import {
  prefetchDashboardHubChunksIdle,
  prefetchTeamHubPageChunk,
} from "@/features/dashboard/prefetchDashboardHubChunks";
import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
import { prefetchCompanyStaff } from "@/features/teamHub/companyStaffCache";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  variant?: "mobile" | "desktop";
};

const PAGE_SELECTOR_PLACEHOLDER_COUNT = 3;

export default function DashboardPageSelector({ onClose, variant = "mobile" }: Props) {
  const { pageIndex, setPageIndex } = useDashboardPager();
  const workspace = useCompanyWorkspaceOptional();
  const companyId = (workspace?.activeCompanyId ?? "").trim() || null;
  const { t } = useTranslation();
  const hubPages = getDashboardCarouselHubPages();
  const isDesktop = variant === "desktop";

  useEffect(() => {
    prefetchDashboardHubChunksIdle();
  }, []);

  const navigate = (index: number) => {
    if (index === TEAM_HUB_SLOT_INDEX) prefetchCompanyStaff(companyId);
    setPageIndex(index);
    onClose();
  };

  const pageButtons = hubPages.map((page) => {
    const Icon = DASHBOARD_MOBILE_NAV_ICONS[page.spotlightLabelKey];
    const active = pageIndex === page.slotIndex;
    return (
      <button
        key={page.slotIndex}
        type="button"
        data-testid={`dashboard-page-selector-item-${page.slotIndex}`}
        className={cn("mobile-page-selector-item", active && "mobile-page-selector-item--active")}
        onClick={() => navigate(page.slotIndex)}
        onPointerEnter={() => {
          if (page.slotIndex === TEAM_HUB_SLOT_INDEX) {
            prefetchTeamHubPageChunk();
            prefetchCompanyStaff(companyId);
          }
        }}
        aria-current={active ? "page" : undefined}
      >
        <span className="mobile-page-selector-icon">
          <Icon size={24} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
        </span>
        <span className="mobile-page-selector-label">
          {String(t(MOBILE_TAB_I18N[page.spotlightLabelKey]))}
        </span>
      </button>
    );
  });

  const grid = (
    <nav className="mobile-page-selector-grid" aria-label="Navigation">
      {pageButtons}
      {Array.from({ length: PAGE_SELECTOR_PLACEHOLDER_COUNT }, (_, index) => (
        <div
          key={`placeholder-${index}`}
          className="mobile-page-selector-item mobile-page-selector-item--placeholder"
          data-testid={`dashboard-page-selector-placeholder-${index}`}
          aria-hidden
        >
          <span className="mobile-page-selector-icon" aria-hidden />
          <span className="mobile-page-selector-label" aria-hidden />
        </div>
      ))}
    </nav>
  );

  if (isDesktop) {
    return (
      <section
        className={cn(
          "dashboard-page-selector",
          "mobile-page-selector",
          dashboardTripleCenterShellClass,
          DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
          "dashboard-page-selector--desktop"
        )}
        data-testid="dashboard-page-selector"
        data-variant={variant}
        aria-label="Navigation"
      >
        <div className="dashboard-page-selector-inner">{grid}</div>
      </section>
    );
  }

  return (
    <MobileCentralPanelFrame
      layoutTestId="dashboard-page-selector-layout"
      testId="dashboard-page-selector"
      sectionClassName={cn("dashboard-page-selector", "mobile-page-selector")}
      innerClassName={`${MOBILE_HUB_PANEL_INNER_CLASS} ${MOBILE_HUB_PANEL_INNER_SCROLL_CLASS}`}
      sectionDataVariant={variant}
      sectionProps={{ "aria-label": "Navigation" }}
    >
      {grid}
    </MobileCentralPanelFrame>
  );
}
