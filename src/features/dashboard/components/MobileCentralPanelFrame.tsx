"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import GlassPanel from "@/core/ui/GlassPanel";
import {
  MOBILE_HUB_LAYOUT_CLASS,
  MOBILE_HUB_PANEL_INNER_CLASS,
  mobileHubPanelGlassShellClass,
} from "@/core/ui/dashboardMobileLayout";

type Props = {
  children: ReactNode;
  testId?: string;
  layoutTestId?: string;
  sectionClassName?: string;
  innerClassName?: string;
  sectionDataVariant?: string;
  sectionProps?: React.ComponentProps<"section">;
};

/**
 * Gabarit du panneau central mobile (carte Mapbox, sélecteur de pages, hubs).
 * Même chrome `.panel-glass` que desktop et `MobileHubLayout`.
 */
export default function MobileCentralPanelFrame({
  children,
  testId,
  layoutTestId,
  sectionClassName,
  innerClassName = MOBILE_HUB_PANEL_INNER_CLASS,
  sectionDataVariant,
  sectionProps,
}: Props) {
  return (
    <div className={MOBILE_HUB_LAYOUT_CLASS} data-testid={layoutTestId}>
      <GlassPanel
        as="section"
        {...sectionProps}
        data-variant={sectionDataVariant}
        data-testid={testId}
        shellClassName={cn(mobileHubPanelGlassShellClass, sectionClassName)}
        innerClassName={innerClassName}
      >
        {children}
      </GlassPanel>
    </div>
  );
}
