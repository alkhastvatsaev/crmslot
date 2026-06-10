"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";
import { MOBILE_HUB_RAILS, type MobileHubRail } from "@/features/dashboard/dashboardMobileNav";
import { usePanelSwipe } from "@/features/dashboard/hooks/usePanelSwipe";
import MobileMapSwipeLock from "@/features/dashboard/components/MobileMapSwipeLock";
import {
  MOBILE_HUB_LAYOUT_CLASS,
  MOBILE_HUB_PANEL_CLASS,
  MOBILE_HUB_PANEL_INNER_CLASS,
  MOBILE_HUB_PANEL_INNER_PADDED_CLASS,
  MOBILE_HUB_PANEL_INNER_SCROLL_CLASS,
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
  sideScroll?: boolean;
  /** Active l'overlay de verrouillage carte sur le panneau centre. */
  centerHasSwipeLock?: boolean;
  onRailChange?: (rail: MobileHubRail) => void;
};

const RAIL_PANEL: Record<MobileHubRail, keyof Pick<Props, "left" | "center" | "right">> = {
  left: "left",
  center: "center",
  right: "right",
};

const RAIL_TEST_ID: Record<
  MobileHubRail,
  keyof Pick<Props, "leftTestId" | "centerTestId" | "rightTestId">
> = {
  left: "leftTestId",
  center: "centerTestId",
  right: "rightTestId",
};

export default function MobileHubLayout({
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
  centerHasSwipeLock = false,
  onRailChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rail, setRail] = useState<MobileHubRail>("center");

  const panels = { left, center, right };
  const testIds: Record<MobileHubRail, string | undefined> = {
    left: leftTestId,
    center: centerTestId,
    right: rightTestId,
  };
  const labels: Record<MobileHubRail, string> = {
    left: leftLabel,
    center: centerLabel,
    right: rightLabel,
  };

  const availableRails = MOBILE_HUB_RAILS.filter((r) => !!panels[RAIL_PANEL[r]]);

  const pickRail = useCallback(
    (next: MobileHubRail) => {
      setRail(next);
      onRailChange?.(next);
    },
    [onRailChange]
  );

  const navigateLeft = useCallback(() => {
    const idx = availableRails.indexOf(rail);
    if (idx < availableRails.length - 1) pickRail(availableRails[idx + 1]);
  }, [availableRails, rail, pickRail]);

  const navigateRight = useCallback(() => {
    const idx = availableRails.indexOf(rail);
    if (idx > 0) pickRail(availableRails[idx - 1]);
  }, [availableRails, rail, pickRail]);

  // Swipe désactivé quand l'overlay carte est déverrouillé (géré par MobileMapSwipeLock)
  const swipeDisabled = centerHasSwipeLock && rail === "center";
  usePanelSwipe(rootRef, navigateLeft, navigateRight, swipeDisabled);

  const innerClass =
    panelPadding && sideScroll && rail !== "center"
      ? `${MOBILE_HUB_PANEL_INNER_SCROLL_CLASS} mobile-hub-panel-inner--padded`
      : panelPadding
        ? MOBILE_HUB_PANEL_INNER_PADDED_CLASS
        : sideScroll && rail !== "center"
          ? MOBILE_HUB_PANEL_INNER_SCROLL_CLASS
          : MOBILE_HUB_PANEL_INNER_CLASS;

  const content = panels[RAIL_PANEL[rail]];

  return (
    <div ref={rootRef} className={MOBILE_HUB_LAYOUT_CLASS} data-testid={rootTestId}>
      {availableRails.length > 1 && (
        <div className="mobile-hub-dots" aria-hidden>
          {availableRails.map((r) => (
            <div
              key={r}
              className={`mobile-hub-dot${rail === r ? " mobile-hub-dot--active" : ""}`}
            />
          ))}
        </div>
      )}

      <section
        aria-label={labels[rail]}
        data-testid={testIds[rail]}
        className={MOBILE_HUB_PANEL_CLASS}
        style={{ position: "relative" }}
      >
        <div className={innerClass}>{content}</div>

        {centerHasSwipeLock && rail === "center" && (
          <MobileMapSwipeLock onSwipeLeft={navigateLeft} onSwipeRight={navigateRight} />
        )}
      </section>
    </div>
  );
}
