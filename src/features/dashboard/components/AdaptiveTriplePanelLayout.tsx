"use client";

import type { ComponentProps } from "react";
import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import MobileHubLayout from "@/features/dashboard/components/MobileHubLayout";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";

type Props = ComponentProps<typeof DashboardTriplePanelLayout> & {
  /** Libellés courts pour le segment mobile (≠ aria desktop). */
  mobileLeftLabel?: string;
  mobileCenterLabel?: string;
  mobileRightLabel?: string;
  /** Bloque le swipe entre panneaux (terrain : étape signature). */
  mobileSwipeDisabled?: boolean;
  /** Rail mobile au chargement (défaut : centre). */
  mobileInitialRail?: "left" | "center" | "right";
  /** Scroll latéral mobile (défaut : true). */
  mobileSideScroll?: boolean;
  /** Callback rail actif (ex. resize Mapbox quand la carte est visible). */
  onRailChange?: (rail: MobileHubRail) => void;
};

/**
 * Bascule automatique desktop (grille 3 cols) / mobile (segment + panneau unique).
 */
export default function AdaptiveTriplePanelLayout({
  leftAriaLabel,
  centerAriaLabel,
  rightAriaLabel,
  mobileLeftLabel,
  mobileCenterLabel,
  mobileRightLabel,
  mobileSwipeDisabled = false,
  mobileInitialRail = "center",
  mobileSideScroll = true,
  onRailChange,
  centerPadding = true,
  rightPadding = true,
  ...props
}: Props) {
  const mobileHubLayout = useMobileHubLayout();
  const panelPadding = centerPadding && rightPadding;

  if (mobileHubLayout) {
    return (
      <MobileHubLayout
        rootTestId={props.rootTestId}
        leftTestId={props.leftTestId}
        centerTestId={props.centerTestId}
        rightTestId={props.rightTestId}
        left={props.left}
        center={props.center}
        right={props.right}
        leftLabel={mobileLeftLabel}
        centerLabel={mobileCenterLabel}
        rightLabel={mobileRightLabel}
        panelPadding={panelPadding}
        sideScroll={mobileSideScroll}
        swipeDisabled={mobileSwipeDisabled}
        mobileInitialRail={mobileInitialRail}
        onRailChange={onRailChange}
      />
    );
  }

  return (
    <DashboardTriplePanelLayout
      {...props}
      leftAriaLabel={leftAriaLabel}
      centerAriaLabel={centerAriaLabel}
      rightAriaLabel={rightAriaLabel}
      centerPadding={centerPadding}
      rightPadding={rightPadding}
    />
  );
}
