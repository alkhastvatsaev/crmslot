"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardPageSelectorOptional } from "@/features/dashboard/DashboardPageSelectorContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import {
  useMobileHubRailSnapshot,
  type MobileHubRailRegistration,
} from "@/features/dashboard/MobileHubRailContext";
import { MOBILE_HUB_DOTS_BAR_CLASS } from "@/core/ui/dashboardMobileLayout";

/** Délai avant de masquer les points quand aucun hub multi-rails n'est actif (hors transition). */
const DOTS_HIDE_DELAY_MS = 250;
/** Marge plus longue pendant un changement de page (hub keep-alive + ré-enregistrement rail). */
const DOTS_PAGE_TRANSITION_HOLD_MS = 500;

export default function MobileHubDotsBar() {
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
    <div className={MOBILE_HUB_DOTS_BAR_CLASS} data-testid="mobile-hub-dots-bar" aria-hidden>
      {showDots ? (
        <div className="mobile-hub-dots">
          {snapshot.rails.map((rail, index) => (
            <div
              key={rail}
              className={`mobile-hub-dot${index === activeIndex ? " mobile-hub-dot--active" : ""}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
