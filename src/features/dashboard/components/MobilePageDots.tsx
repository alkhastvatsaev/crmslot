"use client";

import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useTranslation } from "@/core/i18n/I18nContext";

/** Indicateur de page + navigation rapide (tap). Swipe vertical sur le body aussi. */
export default function MobilePageDots() {
  const { pageIndex, pageCount, setPageIndex } = useDashboardPager();
  const { t } = useTranslation();

  return (
    <nav
      className="mobile-page-dots"
      data-testid="mobile-page-dots"
      aria-label={String(t("mobile.page_nav_label"))}
    >
      {Array.from({ length: pageCount }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`mobile-page-dot ${i === pageIndex ? "mobile-page-dot--active" : ""}`}
          aria-label={`${String(t("mobile.page_nav_label"))} ${i + 1}`}
          aria-current={i === pageIndex ? "page" : undefined}
          data-testid={`mobile-page-dot-${i}`}
          onClick={() => setPageIndex(i)}
        />
      ))}
    </nav>
  );
}
