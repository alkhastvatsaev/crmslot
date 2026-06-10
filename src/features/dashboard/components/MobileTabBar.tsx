"use client";

import { useEffect, useRef } from "react";
import { DASHBOARD_CAROUSEL_PAGES } from "@/features/dashboard/dashboardCarouselRegistry";
import {
  DASHBOARD_MOBILE_NAV_ICONS,
  MOBILE_TAB_I18N,
} from "@/features/dashboard/dashboardMobileNav";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useTranslation } from "@/core/i18n/I18nContext";

/** Tab bar iOS — icônes seules (7 hubs), label en aria-label. */
export default function MobileTabBar() {
  const { pageIndex, setPageIndex } = useDashboardPager();
  const { t } = useTranslation();
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-tab-index="${pageIndex}"]`);
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [pageIndex]);

  return (
    <nav
      className="mobile-tab-bar"
      data-testid="mobile-tab-bar"
      aria-label={String(t("mobile.tab_bar_label"))}
    >
      <div ref={stripRef} className="mobile-tab-bar-strip">
        {DASHBOARD_CAROUSEL_PAGES.map((page) => {
          const Icon = DASHBOARD_MOBILE_NAV_ICONS[page.spotlightLabelKey];
          const active = pageIndex === page.slotIndex;
          const labelKey = MOBILE_TAB_I18N[page.spotlightLabelKey];

          return (
            <button
              key={page.slotIndex}
              type="button"
              data-tab-index={page.slotIndex}
              data-testid={`mobile-tab-${page.slotIndex}`}
              className={`mobile-tab-bar-item ${active ? "mobile-tab-bar-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={String(t(labelKey))}
              title={String(t(labelKey))}
              onClick={() => setPageIndex(page.slotIndex)}
            >
              <Icon
                className="mobile-tab-bar-icon"
                strokeWidth={active ? 2.35 : 1.85}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
