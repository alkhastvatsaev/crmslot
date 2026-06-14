"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  MOBILE_HUB_LAYOUT_CLASS,
  MOBILE_HUB_PANEL_CLASS,
  MOBILE_HUB_PANEL_INNER_CLASS,
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
 * Même chaîne que `MobileHubLayout` : layout gouttières + panel blanc arrondi.
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
      <section
        {...sectionProps}
        data-variant={sectionDataVariant}
        className={cn(MOBILE_HUB_PANEL_CLASS, sectionClassName)}
        data-testid={testId}
      >
        <div className={innerClassName}>{children}</div>
      </section>
    </div>
  );
}
