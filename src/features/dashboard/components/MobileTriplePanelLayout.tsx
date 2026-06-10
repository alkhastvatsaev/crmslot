"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { scrollSnapStripToCenter } from "@/features/dashboard/mobileSnapScroll";
import { useMobileNestedScrollGesture } from "@/features/dashboard/hooks/useMobileNestedScrollGesture";
import {
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_PADDED_CLASS,
  MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
  MOBILE_RAIL_PANEL_CLASS,
  MOBILE_SNAP_STRIP_CLASS,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;
  rootTestId?: string;
  leftTestId?: string;
  centerTestId?: string;
  rightTestId?: string;
  panelPadding?: boolean;
  /** Panneaux latéraux scrollables (défaut true). Centre = overflow hidden. */
  sideScroll?: boolean;
  onStripScroll?: () => void;
};

export default function MobileTriplePanelLayout({
  left,
  center,
  right,
  leftLabel = "Panneau gauche",
  centerLabel = "Panneau principal",
  rightLabel = "Panneau droit",
  rootTestId,
  leftTestId,
  centerTestId,
  rightTestId,
  panelPadding = true,
  sideScroll = true,
  onStripScroll,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useMobileNestedScrollGesture(scrollRef);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    scrollSnapStripToCenter(el, 1);
  }, []);

  const sideInnerClass = panelPadding
    ? sideScroll
      ? `${MOBILE_HUB_PANEL_INNER_SCROLL_CLASS} mobile-rail-panel-inner--padded`
      : MOBILE_HUB_PANEL_INNER_PADDED_CLASS
    : sideScroll
      ? MOBILE_HUB_PANEL_INNER_SCROLL_CLASS
      : MOBILE_HUB_PANEL_INNER_CLASS;

  const centerInnerClass = panelPadding
    ? MOBILE_HUB_PANEL_INNER_PADDED_CLASS
    : MOBILE_HUB_PANEL_INNER_CLASS;

  return (
    <div className="mobile-page-frame">
      <div
        ref={scrollRef}
        data-testid={rootTestId}
        className={MOBILE_SNAP_STRIP_CLASS}
        onScroll={onStripScroll}
      >
        <section
          aria-label={leftLabel}
          data-testid={leftTestId}
          className={MOBILE_RAIL_PANEL_CLASS}
        >
          <div className={`flex ${sideInnerClass}`}>{left}</div>
        </section>

        <section
          aria-label={centerLabel}
          data-testid={centerTestId}
          className={MOBILE_RAIL_PANEL_CLASS}
        >
          <div className={`flex ${centerInnerClass}`}>{center}</div>
        </section>

        <section
          aria-label={rightLabel}
          data-testid={rightTestId}
          className={MOBILE_RAIL_PANEL_CLASS}
        >
          <div className={`flex ${sideInnerClass}`}>{right}</div>
        </section>
      </div>
    </div>
  );
}
