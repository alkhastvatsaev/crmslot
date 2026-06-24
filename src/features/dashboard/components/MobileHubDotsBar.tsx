"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useDashboardPageSelectorOptional } from "@/features/dashboard/DashboardPageSelectorContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import {
  useMobileHubRailSnapshot,
  type MobileHubRailRegistration,
} from "@/features/dashboard/MobileHubRailContext";
import { MOBILE_HUB_RAIL_I18N } from "@/features/dashboard/dashboardMobileNav";
import { MOBILE_HUB_DOTS_BAR_CLASS } from "@/core/ui/dashboardMobileLayout";
import { cn } from "@/lib/utils";

/** Délai avant de masquer les points quand aucun hub multi-rails n'est actif (hors transition). */
const DOTS_HIDE_DELAY_MS = 250;
/** Marge plus longue pendant un changement de page (hub keep-alive + ré-enregistrement rail). */
const DOTS_PAGE_TRANSITION_HOLD_MS = 500;

export default function MobileHubDotsBar() {
  const { t } = useTranslation();
  const visibleSnapshot = useMobileHubRailSnapshot();
  const pageSelectorOpen = useDashboardPageSelectorOptional()?.open ?? false;
  const pageIndex = useDashboardPagerOptional()?.pageIndex ?? 0;
  const [lastSnapshot, setLastSnapshot] = useState<MobileHubRailRegistration | null>(null);
  const prevPageIndex = useRef(pageIndex);
  const visibleSnapshotRef = useRef(visibleSnapshot);
  visibleSnapshotRef.current = visibleSnapshot;

  useEffect(() => {
    const pageChanged = pageIndex !== prevPageIndex.current;
    if (pageChanged) {
      prevPageIndex.current = pageIndex;
    }

    if (visibleSnapshot) {
      setLastSnapshot(visibleSnapshot);
      return;
    }

    if (pageSelectorOpen) return;

    const delay = pageChanged ? DOTS_PAGE_TRANSITION_HOLD_MS : DOTS_HIDE_DELAY_MS;
    const timeout = window.setTimeout(() => {
      if (!visibleSnapshotRef.current) setLastSnapshot(null);
    }, delay);
    return () => clearTimeout(timeout);
  }, [visibleSnapshot, pageIndex, pageSelectorOpen]);

  const snapshot = visibleSnapshot ?? lastSnapshot;
  const showDots = snapshot != null && snapshot.rails.length > 1;
  const activeIndex = showDots ? snapshot.rails.indexOf(snapshot.activeRail) : -1;

  return (
    <div
      className={cn(MOBILE_HUB_DOTS_BAR_CLASS, showDots && "mobile-hub-dots-bar--interactive")}
      data-testid="mobile-hub-dots-bar"
      role={showDots ? "tablist" : undefined}
      aria-label={showDots ? String(t("mobile.rail_segment_label")) : undefined}
    >
      {showDots ? (
        <div className="mobile-hub-dots">
          {snapshot.rails.map((rail, index) => (
            <button
              key={rail}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={String(t(MOBILE_HUB_RAIL_I18N[rail]))}
              data-testid={`mobile-hub-dot-${rail}`}
              className={cn("mobile-hub-dot", index === activeIndex && "mobile-hub-dot--active")}
              onClick={() => snapshot.requestRail(rail)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
