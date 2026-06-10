"use client";

import type { ComponentProps } from "react";
import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import MobileHubLayout from "@/features/dashboard/components/MobileHubLayout";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

type Props = ComponentProps<typeof DashboardTriplePanelLayout> & {
  /** Libellés courts pour le segment mobile (≠ aria desktop). */
  mobileLeftLabel?: string;
  mobileCenterLabel?: string;
  mobileRightLabel?: string;
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
  centerPadding = true,
  rightPadding = true,
  ...props
}: Props) {
  const isMobile = useIsMobile();
  const panelPadding = centerPadding && rightPadding;

  if (isMobile) {
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
