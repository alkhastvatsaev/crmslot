"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DASHBOARD_DESKTOP_PAGER_CONTROLS_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

const iconClass = "h-9 w-9 shrink-0";

/**
 * Flèches carrousel — ancrées sur le stack, dans la gouttière padding (hors rails glass).
 */
export default function DashboardPagerControls() {
  const pager = useDashboardPagerOptional();
  if (!pager) return null;

  const { pageIndex, pageCount, goNext, goPrev } = pager;
  const atStart = pageIndex === 0;
  const atEnd = pageIndex >= pageCount - 1;
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
            : pageCount === 2
              ? "Aller à la deuxième page"
              : `Aller à la page ${human + 1}`
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
