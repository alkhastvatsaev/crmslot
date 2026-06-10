"use client";

import { DASHBOARD_CAROUSEL_PAGES } from "@/features/dashboard/dashboardCarouselRegistry";
import { DASHBOARD_MOBILE_NAV_ICONS } from "@/features/dashboard/dashboardMobileNav";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobilePageSelector({ open, onClose }: Props) {
  const { pageIndex, setPageIndex } = useDashboardPager();

  const navigate = (index: number) => {
    setPageIndex(index);
    onClose();
  };

  return (
    <div
      className="mobile-page-selector"
      data-open={open}
      data-testid="mobile-page-selector"
      aria-hidden={!open}
    >
      <div className="mobile-page-selector-grid">
        {DASHBOARD_CAROUSEL_PAGES.map((page) => {
          const Icon = DASHBOARD_MOBILE_NAV_ICONS[page.spotlightLabelKey];
          const active = pageIndex === page.slotIndex;
          return (
            <button
              key={page.slotIndex}
              type="button"
              className={`mobile-page-selector-item${active ? " mobile-page-selector-item--active" : ""}`}
              onClick={() => navigate(page.slotIndex)}
              tabIndex={open ? 0 : -1}
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-page-selector-icon">
                <Icon size={24} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              </span>
              <span className="mobile-page-selector-label">{page.guideTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
