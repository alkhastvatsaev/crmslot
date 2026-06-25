"use client";

import { getDashboardCarouselHubPages } from "@/features/dashboard/dashboardCarouselRegistry";
import {
  DASHBOARD_MOBILE_NAV_ICONS,
  MOBILE_TAB_I18N,
} from "@/features/dashboard/dashboardMobileNav";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
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
import DashboardLanguageSelector from "@/features/dashboard/components/DashboardLanguageSelector";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  variant?: "mobile" | "desktop";
};

export default function DashboardPageSelector({ onClose, variant = "mobile" }: Props) {
  const { pageIndex, setPageIndex } = useDashboardPager();
  const { t } = useTranslation();
  const hubPages = getDashboardCarouselHubPages();
  const isDesktop = variant === "desktop";

  const navigate = (index: number) => {
    setPageIndex(index);
    onClose();
  };

  const grid = (
    <nav
      className={cn(
        "dashboard-page-selector-grid",
        isDesktop ? "dashboard-page-selector-grid--desktop" : "mobile-page-selector-grid"
      )}
      aria-label="Navigation"
    >
      {hubPages.map((page) => {
        const Icon = DASHBOARD_MOBILE_NAV_ICONS[page.spotlightLabelKey];
        const active = pageIndex === page.slotIndex;
        return (
          <button
            key={page.slotIndex}
            type="button"
            data-testid={`dashboard-page-selector-item-${page.slotIndex}`}
            className={cn(
              "dashboard-page-selector-item",
              isDesktop ? "dashboard-page-selector-item--desktop" : "mobile-page-selector-item",
              active &&
                (isDesktop
                  ? "dashboard-page-selector-item--active"
                  : "mobile-page-selector-item--active")
            )}
            onClick={() => navigate(page.slotIndex)}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={cn(
                isDesktop ? "dashboard-page-selector-icon" : "mobile-page-selector-icon"
              )}
            >
              <Icon size={isDesktop ? 28 : 24} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            </span>
            <span
              className={cn(
                isDesktop ? "dashboard-page-selector-label" : "mobile-page-selector-label"
              )}
            >
              {String(t(MOBILE_TAB_I18N[page.spotlightLabelKey]))}
            </span>
          </button>
        );
      })}
    </nav>
  );

  if (isDesktop) {
    return (
      <section
        className={cn(
          "dashboard-page-selector",
          dashboardTripleCenterShellClass,
          DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
          "dashboard-page-selector--desktop"
        )}
        data-testid="dashboard-page-selector"
        data-variant={variant}
        aria-label="Navigation"
      >
        <div className="dashboard-page-selector-inner">
          <DashboardLanguageSelector variant="desktop" />
          {grid}
        </div>
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
