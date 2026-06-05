"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DASHBOARD_DESKTOP_PAGER_CONTROLS_CLASS } from "@/core/ui/dashboardDesktopLayout";
import {
  getNextDashboardCarouselNavIndex,
  getPrevDashboardCarouselNavIndex,
} from "@/features/dashboard/dashboardCarouselRegistry";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

const iconClass = "h-9 w-9 shrink-0";

/**
 * Flèches carrousel — ancrées sur le stack, dans la gouttière padding (hors rails glass).
 */
export default function DashboardPagerControls() {
  const pager = useDashboardPagerOptional();
  if (!pager) return null;

  const { pageIndex, goNext, goPrev } = pager;
  const atStart = getPrevDashboardCarouselNavIndex(pageIndex) === pageIndex;
  const atEnd = getNextDashboardCarouselNavIndex(pageIndex) === pageIndex;
  const human = pageIndex + 1;

  return (
    <div
      className={DASHBOARD_DESKTOP_PAGER_CONTROLS_CLASS}
      data-testid="dashboard-pager-controls"
      aria-hidden={false}
    >
      <button
        type="button"
        data-testid="dashboard-pager-prev"
        aria-label={atStart ? "Déjà sur la première page" : `Revenir à la page ${human - 1}`}
        disabled={atStart}
        onClick={goPrev}
        className="dashboard-desktop-pager-controls__btn dashboard-desktop-pager-controls__btn--prev"
      >
        <ChevronLeft className={iconClass} aria-hidden strokeWidth={2.5} />
      </button>

      <button
        type="button"
        data-testid="dashboard-pager-next"
        aria-label={
          atEnd
            ? "Déjà sur la dernière page"
            : `Aller à la page ${getNextDashboardCarouselNavIndex(pageIndex) + 1}`
        }
        disabled={atEnd}
        onClick={goNext}
        className="dashboard-desktop-pager-controls__btn dashboard-desktop-pager-controls__btn--next"
      >
        <ChevronRight className={iconClass} aria-hidden strokeWidth={2.5} />
      </button>
    </div>
  );
}
